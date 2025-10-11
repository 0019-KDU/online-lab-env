const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();

// Load config based on environment
if (process.env.NODE_ENV === 'production') {
  kc.loadFromCluster(); // Load from service account when running in cluster
} else {
  kc.loadFromDefault(); // Load from ~/.kube/config for local development
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

class K8sService {
  // Deploy a new lab pod for student
  async deployLabPod(labSession, template) {
    const podName = labSession.podName;
    const namespace = labSession.namespace;
    const studentId = labSession.student.toString();

    // Generate random VNC port (range: 30000-32767)
    const vncPort = Math.floor(Math.random() * (32767 - 30000) + 30000);

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
              { name: 'VNC_PASSWORD', value: 'student123' }, // Should be generated
              { name: 'STUDENT_ID', value: studentId },
            ],
            volumeMounts: [
              {
                name: 'student-workspace',
                mountPath: '/home/student',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'student-workspace',
            persistentVolumeClaim: {
              claimName: `pvc-${studentId}`,
            },
          },
        ],
        restartPolicy: 'Never',
      },
    };

    try {
      // Create the pod
      await k8sApi.createNamespacedPod(namespace, podManifest);

      // Create service to expose the pod
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
              nodePort: vncPort,
              protocol: 'TCP',
            },
          ],
        },
      };

      await k8sApi.createNamespacedService(namespace, serviceManifest);

      // Get node IP (simplified - in production use LoadBalancer or Ingress)
      const nodes = await k8sApi.listNode();
      const nodeIp = nodes.body.items[0].status.addresses.find(
        addr => addr.type === 'ExternalIP' || addr.type === 'InternalIP'
      ).address;

      return {
        accessUrl: `http://${nodeIp}:${vncPort}`,
        vncPort: vncPort,
      };
    } catch (error) {
      console.error('Error deploying lab pod:', error);
      throw new Error('Failed to deploy lab environment');
    }
  }

  // Delete a lab pod
  async deleteLabPod(podName, namespace) {
    try {
      // Delete pod
      await k8sApi.deleteNamespacedPod(podName, namespace);
      
      // Delete associated service
      await k8sApi.deleteNamespacedService(`svc-${podName}`, namespace);
      
      return true;
    } catch (error) {
      console.error('Error deleting lab pod:', error);
      throw new Error('Failed to delete lab environment');
    }
  }

  // Check pod status
  async getPodStatus(podName, namespace) {
    try {
      const pod = await k8sApi.readNamespacedPod(podName, namespace);
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
      // Check if PVC exists
      await k8sApi.readNamespacedPersistentVolumeClaim(pvcName, namespace);
      return pvcName; // Already exists
    } catch (error) {
      // PVC doesn't exist, create it
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

      await k8sApi.createNamespacedPersistentVolumeClaim(namespace, pvcManifest);
      return pvcName;
    }
  }
}

module.exports = new K8sService();