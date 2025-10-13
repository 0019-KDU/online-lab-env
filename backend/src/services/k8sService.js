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

    // Pod specification
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
            name: 'registry-cyberlab-registry',
          },
        ],
        containers: [
          {
            name: 'ubuntu-desktop',
            image: template.image,
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

      // Generate random NodePort (30000-32767)
      const nodePort = Math.floor(Math.random() * (32767 - 30000) + 30000);

      // Create NodePort service
      const serviceManifest = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: `svc-${podName}`,
          namespace: namespace,
        },
        spec: {
          type: 'NodePort',
          selector: {
            app: 'student-lab',
            session: labSession._id.toString(),
          },
          ports: [
            {
              port: 6080,
              targetPort: 6080,
              nodePort: nodePort,
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
        console.log('✅ NodePort Service created:', `svc-${podName}`, 'Port:', nodePort);
      } catch (svcError) {
        console.error('Failed to create service:', svcError.body || svcError.message);
        throw new Error(`Failed to create service: ${svcError.body?.message || svcError.message}`);
      }

      // Use the public IP configured in environment
      const publicIP = process.env.PUBLIC_NODE_IP || '152.42.156.112';

      const accessUrl = `http://${publicIP}:${nodePort}/vnc.html?autoconnect=true`;
      console.log('✅ Generated access URL:', accessUrl);

      return {
        accessUrl: accessUrl,
        vncPort: nodePort,
        publicIP: publicIP
      };
    } catch (error) {
      console.error('Error deploying lab pod:', error);
      console.error('Error details:', error.body || error.message || error);
      throw new Error(`Failed to deploy lab environment: ${error.message}`);
    }
  }

  // Delete a lab pod
  async deleteLabPod(podName, namespace) {
    try {
      await k8sApi.deleteNamespacedPod({
        name: podName,
        namespace: namespace
      });
      await k8sApi.deleteNamespacedService({
        name: `svc-${podName}`,
        namespace: namespace
      });
      return true;
    } catch (error) {
      console.error('Error deleting lab pod:', error);
      throw new Error('Failed to delete lab environment');
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

  // Create PVC for student if doesn't exist
  async ensureStudentPVC(studentId, namespace, storageSize = '5Gi') {
    const pvcName = `pvc-${studentId}`;

    try {
      await k8sApi.readNamespacedPersistentVolumeClaim({
        name: pvcName,
        namespace: namespace
      });
      return pvcName;
    } catch (error) {
      const pvcManifest = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
          name: pvcName,
          namespace: namespace,
        },
        spec: {
          accessModes: ['ReadWriteOnce'],
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
      return pvcName;
    }
  }
}

export default new K8sService();