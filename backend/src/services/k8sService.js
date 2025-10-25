import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();

// Load config based on environment
if (process.env.NODE_ENV === 'production') {
  kc.loadFromCluster();
} else {
  kc.loadFromDefault();
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

class K8sService {
  // Deploy a new lab pod for student
  async deployLabPod(labSession, template) {
    const podName = labSession.podName;
    // Ensure we extract namespace from Mongoose document properly
    const namespace = labSession.namespace || labSession._doc?.namespace || process.env.K8S_NAMESPACE || 'student-labs';
    const studentId = labSession.student.toString();

    // Debug logging
    console.log('deployLabPod called with:', {
      podName,
      namespace,
      studentId,
      hasNamespace: !!labSession.namespace,
      labSessionType: typeof labSession,
      isMongooseDoc: labSession.constructor?.name
    });

    if (!namespace) {
      throw new Error('Namespace is required but was not provided');
    }

    // Create PVC for student if doesn't exist
    const pvcName = await this.ensureStudentPVC(studentId, namespace);
    console.log('✅ PVC ensured for student:', studentId, 'PVC:', pvcName);

    // Pod specification with PVC mounted
    const podManifest = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: podName,
        namespace: namespace,
        labels: {
          app: 'student-lab',
          student: studentId,
          session: labSession._id.toString(),
        },
      },
      spec: {
        imagePullSecrets: [
          {
            name: 'cyberlab-registry',
          },
        ],
        volumes: [
          {
            name: 'student-workspace',
            persistentVolumeClaim: {
              claimName: pvcName,
            },
          },
        ],
        containers: [
          {
            name: 'ubuntu-desktop',
            image: template.image,
            imagePullPolicy: 'Always', // Always pull latest image from registry
            ports: [
              { containerPort: 5901, name: 'vnc' },
              { containerPort: 6080, name: 'novnc' },
            ],
            resources: {
              requests: {
                memory: template.resources.memory,
                cpu: template.resources.cpu,
              },
              limits: {
                memory: template.resources.memory,
                cpu: template.resources.cpu,
              },
            },
            env: [
              { name: 'VNC_PASSWORD', value: 'student123' },
              { name: 'STUDENT_ID', value: studentId },
            ],
            volumeMounts: [
              {
                name: 'student-workspace',
                mountPath: '/home/student',
              },
            ],
            // Readiness probe - Check if noVNC is accessible
            readinessProbe: {
              httpGet: {
                path: '/vnc.html',
                port: 6080,
                scheme: 'HTTP'
              },
              initialDelaySeconds: 15,
              periodSeconds: 5,
              timeoutSeconds: 3,
              successThreshold: 1,
              failureThreshold: 3
            },
            // Liveness probe - Ensure container is still running properly
            livenessProbe: {
              httpGet: {
                path: '/vnc.html',
                port: 6080,
                scheme: 'HTTP'
              },
              initialDelaySeconds: 30,
              periodSeconds: 10,
              timeoutSeconds: 5,
              successThreshold: 1,
              failureThreshold: 3
            },
            // Startup probe - Give enough time for desktop to fully initialize
            startupProbe: {
              httpGet: {
                path: '/vnc.html',
                port: 6080,
                scheme: 'HTTP'
              },
              initialDelaySeconds: 10,
              periodSeconds: 5,
              timeoutSeconds: 3,
              successThreshold: 1,
              failureThreshold: 12 // Allow up to 60 seconds for startup (12 * 5s)
            }
          },
        ],
        restartPolicy: 'Never',
      },
    };

    try {
      // Create the pod
      console.log('About to call createNamespacedPod with namespace:', namespace);
      const createPodResponse = await k8sApi.createNamespacedPod({
        namespace: namespace,
        body: podManifest
      });
      console.log('Pod created successfully:', createPodResponse.body?.metadata?.name);

      // Create ClusterIP service (internal only)
      const serviceManifest = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: `svc-${podName}`,
          namespace: namespace,
        },
        spec: {
          type: 'ClusterIP', // Internal only, accessed via Ingress
          selector: {
            app: 'student-lab',
            session: labSession._id.toString(),
          },
          ports: [
            {
              port: 6080,
              targetPort: 6080,
              protocol: 'TCP',
              name: 'novnc'
            },
          ],
        },
      };

      try {
        await k8sApi.createNamespacedService({
          namespace: namespace,
          body: serviceManifest
        });
        console.log('✅ ClusterIP Service created:', `svc-${podName}`);
      } catch (svcError) {
        console.error('Failed to create service:', svcError.body || svcError.message);
        throw new Error(`Failed to create service: ${svcError.body?.message || svcError.message}`);
      }

      // Create Ingress for this lab session
      const sessionId = labSession._id.toString();
      await this.createLabIngress(podName, sessionId, namespace);

      // Wait for pod to be ready before returning URL
      console.log('⏳ Waiting for pod to be ready...');
      await this.waitForPodReady(podName, namespace, 90);
      console.log('✅ Pod is ready and accessible!');

      // Generate secure access URL with ingress path
      const domain = process.env.LAB_DOMAIN || 'labs.your-domain.com';
      const protocol = process.env.LAB_PROTOCOL || 'https';
      // Include path parameter for noVNC to know the WebSocket base path
      // Add scaling and display options: resize=scale to fit desktop to window
      const accessUrl = `${protocol}://${domain}/lab/${sessionId}/vnc.html?path=/lab/${sessionId}/websockify&autoconnect=true&resize=scale&quality=9`;
      console.log('✅ Generated secure access URL:', accessUrl);

      return {
        accessUrl: accessUrl,
        sessionId: sessionId,
        domain: domain
      };
    } catch (error) {
      console.error('Error deploying lab pod:', error);
      console.error('Error details:', error.body || error.message || error);
      throw new Error(`Failed to deploy lab environment: ${error.message}`);
    }
  }

  // Method to create Ingress for a lab session
  async createLabIngress(podName, sessionId, namespace = 'student-labs') {
    try {
      const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
      
      const ingressName = `ingress-${podName}`;
      const serviceName = `svc-${podName}`;
      const domain = process.env.LAB_DOMAIN || 'labs.your-domain.com';

      const ingressManifest = {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'Ingress',
        metadata: {
          name: ingressName,
          namespace: namespace,
          annotations: {
            // Removed cert-manager due to Let's Encrypt rate limits on nip.io domain
            'nginx.ingress.kubernetes.io/rewrite-target': '/$2',
            'nginx.ingress.kubernetes.io/ssl-redirect': 'false', // Disable SSL redirect - using HTTP
            'nginx.ingress.kubernetes.io/websocket-services': serviceName,
            'nginx.ingress.kubernetes.io/proxy-read-timeout': '3600',
            'nginx.ingress.kubernetes.io/proxy-send-timeout': '3600',
            'nginx.ingress.kubernetes.io/proxy-connect-timeout': '300',
            'nginx.ingress.kubernetes.io/backend-protocol': 'HTTP', // Explicitly set backend protocol
            // Additional fixes for connection stability
            'nginx.ingress.kubernetes.io/proxy-buffering': 'off',
            'nginx.ingress.kubernetes.io/proxy-request-buffering': 'off',
            'nginx.ingress.kubernetes.io/proxy-http-version': '1.1'
            // Note: configuration-snippet removed - snippets are disabled by ingress administrator
          }
        },
        spec: {
          ingressClassName: 'nginx', // Use spec.ingressClassName instead of deprecated annotation
          // TLS removed due to Let's Encrypt rate limits on nip.io
          rules: [{
            host: domain,
            http: {
              paths: [{
                path: `/lab/${sessionId}(/|$)(.*)`,
                pathType: 'ImplementationSpecific',
                backend: {
                  service: {
                    name: serviceName,
                    port: { number: 6080 }
                  }
                }
              }]
            }
          }]
        }
      };

      await k8sNetworkingApi.createNamespacedIngress({
        namespace: namespace,
        body: ingressManifest
      });
      console.log('✅ Ingress created:', ingressName);
      
      return ingressName;
    } catch (error) {
      console.error('Error creating ingress:', error.body || error.message);
      throw new Error(`Failed to create ingress: ${error.body?.message || error.message}`);
    }
  }

  // Method to delete a lab pod
  async deleteLabPod(podName, namespace = 'student-labs') {
    try {
      const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
      const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

      // Delete the pod
      await k8sCoreApi.deleteNamespacedPod({
        name: podName,
        namespace: namespace
      });
      console.log('✅ Pod deleted:', podName);

      // Delete the associated service
      const serviceName = `svc-${podName}`;
      await k8sCoreApi.deleteNamespacedService({
        name: serviceName,
        namespace: namespace
      });
      console.log('✅ Service deleted:', serviceName);

      // Delete the associated ingress
      const ingressName = `ingress-${podName}`;
      try {
        await k8sNetworkingApi.deleteNamespacedIngress({
          name: ingressName,
          namespace: namespace
        });
        console.log('✅ Ingress deleted:', ingressName);
      } catch (ingressError) {
        console.warn('⚠️ Ingress deletion warning:', ingressError.body?.message || ingressError.message);
      }

      return true;
    } catch (error) {
      console.error('Error deleting lab pod:', error.body || error.message);
      throw new Error(`Failed to delete lab pod: ${error.body?.message || error.message}`);
    }
  }

  // Check pod status
  async getPodStatus(podName, namespace) {
    try {
      const pod = await k8sApi.readNamespacedPod({
        name: podName,
        namespace: namespace
      });
      return pod.body.status.phase;
    } catch (error) {
      console.error('Error getting pod status:', error);
      return 'Unknown';
    }
  }

  // Wait for pod to be ready with timeout
  async waitForPodReady(podName, namespace, timeoutSeconds = 90) {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const pod = await k8sApi.readNamespacedPod({
          name: podName,
          namespace: namespace
        });

        const podStatus = pod.body.status;
        
        // Check if pod is ready
        if (podStatus.conditions) {
          const readyCondition = podStatus.conditions.find(c => c.type === 'Ready');
          if (readyCondition && readyCondition.status === 'True') {
            console.log(`✅ Pod ${podName} is ready!`);
            return true;
          }
        }

        // Log current status
        console.log(`⏳ Pod ${podName} status: ${podStatus.phase}, waiting for Ready...`);
        
        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error checking pod status: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    throw new Error(`Timeout waiting for pod ${podName} to be ready after ${timeoutSeconds} seconds`);
  }

  // Create PVC for student if doesn't exist
  async ensureStudentPVC(studentId, namespace, storageSize = '5Gi') {
    const pvcName = `pvc-${studentId}`;

    try {
      // Check if PVC already exists
      await k8sApi.readNamespacedPersistentVolumeClaim({
        name: pvcName,
        namespace: namespace
      });
      console.log('PVC already exists:', pvcName);
      return pvcName;
    } catch (error) {
      // PVC doesn't exist, create it
      console.log('Creating new PVC for student:', studentId);
      const pvcManifest = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
          name: pvcName,
          namespace: namespace,
        },
        spec: {
          accessModes: ['ReadWriteOnce'],
          storageClassName: 'do-block-storage', // DigitalOcean Block Storage
          resources: {
            requests: {
              storage: storageSize,
            },
          },
        },
      };

      await k8sApi.createNamespacedPersistentVolumeClaim({
        namespace: namespace,
        body: pvcManifest
      });
      console.log('✅ PVC created successfully:', pvcName);
      return pvcName;
    }
  }
}

export default new K8sService();