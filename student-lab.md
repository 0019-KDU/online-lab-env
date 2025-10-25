# Student Lab Creation & Networking - Detailed Technical Guide

This document provides an in-depth explanation of how CyberLab creates and manages student lab environments using Kubernetes.

---

## 📋 Table of Contents

- [Overview](#overview)
- [How Kubernetes Orchestrates Labs](#how-kubernetes-orchestrates-labs)
- [Student Lab Creation Flow](#student-lab-creation-flow)
- [Networking Architecture](#networking-architecture)
- [Frontend to Backend Flow](#frontend-to-backend-flow)
- [Backend to Kubernetes API](#backend-to-kubernetes-api)
- [Lab Pod Internal Architecture](#lab-pod-internal-architecture)
- [Storage & Persistence](#storage--persistence)
- [Security & Isolation](#security--isolation)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Overview

When a student clicks "Start Lab" in the browser, a complex orchestration process begins. The system creates isolated, fully-functional Ubuntu desktop environments on-demand, accessible through a web browser via noVNC.

**Key Components:**
- Frontend (React) - User interface
- Backend (Node.js) - API & orchestration logic
- Kubernetes Cluster - Container orchestration
- Lab Pods - Ubuntu desktop containers
- MongoDB Atlas - Session & user data storage
- NGINX Ingress - Traffic routing

---

## How Kubernetes Orchestrates Labs

### Kubernetes Architecture in CyberLab

```
┌─────────────────────────────────────────────────────────────────┐
│                     KUBERNETES CLUSTER (DOKS)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Master     │  │  etcd Store  │  │  API Server  │          │
│  │  Components  │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    NAMESPACES                            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  default:          Frontend pods, Backend pods           │   │
│  │  student-labs:     Lab pods, PVCs, Services, Ingresses   │   │
│  │  monitoring:       Prometheus, Grafana                   │   │
│  │  argocd:           ArgoCD controller                     │   │
│  │  ingress-nginx:    NGINX Ingress Controller              │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    WORKER NODES (5x)                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  Node 1: kubelet, containerd, kube-proxy                 │   │
│  │  Node 2: kubelet, containerd, kube-proxy                 │   │
│  │  Node 3: kubelet, containerd, kube-proxy                 │   │
│  │  Node 4: kubelet, containerd, kube-proxy                 │   │
│  │  Node 5: kubelet, containerd, kube-proxy                 │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How Kubernetes Resources Work Together

1. **Pods**: The smallest deployable unit; contains one or more containers
2. **Services**: Stable network endpoint for pods (ClusterIP, LoadBalancer)
3. **Ingress**: HTTP/HTTPS routing rules to services
4. **PersistentVolumeClaim (PVC)**: Request for storage; backed by DigitalOcean Block Storage
5. **Namespaces**: Logical isolation boundaries for resources
6. **RBAC**: Role-based access control (lab-manager ServiceAccount)

---

## Student Lab Creation Flow

### Complete Step-by-Step Process

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Student Browser Action                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  • Student logs in (JWT token stored in browser)                         │
│  • Clicks "Start Ubuntu Lab" button                                      │
│  • Frontend (React) sends HTTP POST request:                             │
│                                                                            │
│    POST https://152-42-156-112.nip.io/api/labs/start                     │
│    Headers:                                                               │
│      Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...       │
│      Content-Type: application/json                                      │
│    Body:                                                                  │
│      {                                                                    │
│        "templateId": "ubuntu-desktop-basic"                              │
│      }                                                                    │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2: DigitalOcean Load Balancer                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  • Load Balancer IP: 152.42.156.112                                      │
│  • Receives HTTPS request on port 443                                    │
│  • Forwards to NGINX Ingress Controller service                          │
│  • Target: ingress-nginx-controller service (NodePort or LoadBalancer)   │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 3: NGINX Ingress Controller                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Namespace: ingress-nginx                                                 │
│  Pod: ingress-nginx-controller-xxxxxxxxx-xxxxx                           │
│                                                                            │
│  • Receives request at /api/labs/start                                   │
│  • Matches Ingress rule:                                                 │
│      path: /api/*                                                         │
│      backend: backend-service:5000 (ClusterIP)                           │
│  • Performs internal service discovery via CoreDNS                       │
│  • Forwards to backend pod                                               │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Backend - Authentication Middleware                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  File: backend/src/middleware/auth.js                                    │
│  Function: protect()                                                      │
│                                                                            │
│  1. Extract JWT from Authorization header:                               │
│     const token = req.headers.authorization.split(' ')[1];               │
│                                                                            │
│  2. Verify token signature:                                              │
│     const decoded = jwt.verify(token, process.env.JWT_SECRET);           │
│                                                                            │
│  3. Extract student ID:                                                  │
│     const studentId = decoded.id;                                        │
│                                                                            │
│  4. Fetch student from MongoDB:                                          │
│     const student = await Student.findById(studentId);                   │
│                                                                            │
│  5. Attach to request:                                                   │
│     req.user = student;                                                  │
│     next();                                                               │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Backend - Lab Controller                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  File: backend/src/controllers/labController.js                         │
│  Function: startLab()                                                     │
│                                                                            │
│  1. Generate unique session ID:                                          │
│     const sessionId = `lab-${studentId}-${Date.now()}`;                  │
│                                                                            │
│  2. Check if student already has active session:                         │
│     const existingSession = await LabSession.findOne({                   │
│       studentId: req.user._id,                                           │
│       status: 'active'                                                    │
│     });                                                                   │
│                                                                            │
│  3. If exists, return existing URL; else create new resources           │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Backend - Kubernetes Service (Resource Creation)                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  File: backend/src/services/k8sService.js                               │
│  Function: createLabPod()                                                 │
│                                                                            │
│  The backend uses the official Kubernetes JavaScript client to:          │
│                                                                            │
│  A. CREATE PERSISTENT VOLUME CLAIM (PVC)                                 │
│  ════════════════════════════════════════════════════════════════        │
│                                                                            │
│  const pvcManifest = {                                                   │
│    apiVersion: 'v1',                                                     │
│    kind: 'PersistentVolumeClaim',                                        │
│    metadata: {                                                            │
│      name: `${sessionId}-pvc`,                                           │
│      namespace: 'student-labs'                                           │
│    },                                                                     │
│    spec: {                                                                │
│      accessModes: ['ReadWriteOnce'],                                     │
│      resources: {                                                         │
│        requests: {                                                        │
│          storage: '5Gi'  // 5GB per student                              │
│        }                                                                  │
│      },                                                                   │
│      storageClassName: 'do-block-storage'                                │
│    }                                                                      │
│  };                                                                       │
│                                                                            │
│  await k8sCoreApi.createNamespacedPersistentVolumeClaim(                 │
│    'student-labs',                                                        │
│    pvcManifest                                                            │
│  );                                                                       │
│                                                                            │
│  B. CREATE POD (Ubuntu Desktop Container)                                │
│  ════════════════════════════════════════════════════════════════        │
│                                                                            │
│  const podManifest = {                                                   │
│    apiVersion: 'v1',                                                     │
│    kind: 'Pod',                                                          │
│    metadata: {                                                            │
│      name: sessionId,                                                    │
│      namespace: 'student-labs',                                          │
│      labels: {                                                            │
│        app: 'lab-pod',                                                   │
│        student: studentId,                                               │
│        session: sessionId                                                │
│      }                                                                    │
│    },                                                                     │
│    spec: {                                                                │
│      containers: [{                                                       │
│        name: 'ubuntu-desktop',                                           │
│        image: 'registry.digitalocean.com/cyberlab/ubuntu-desktop:latest',│
│        ports: [                                                           │
│          { containerPort: 6080, name: 'novnc' },                         │
│          { containerPort: 5900, name: 'vnc' }                            │
│        ],                                                                 │
│        env: [                                                             │
│          { name: 'RESOLUTION', value: '1920x1080' },                     │
│          { name: 'VNC_PASSWORD', value: 'cyberlab123' }                  │
│        ],                                                                 │
│        volumeMounts: [{                                                   │
│          name: 'student-data',                                           │
│          mountPath: '/home/student'                                      │
│        }],                                                                │
│        resources: {                                                       │
│          requests: {                                                      │
│            memory: '2Gi',                                                │
│            cpu: '1000m'  // 1 CPU core                                   │
│          },                                                               │
│          limits: {                                                        │
│            memory: '4Gi',                                                │
│            cpu: '2000m'  // 2 CPU cores max                              │
│          }                                                                │
│        }                                                                  │
│      }],                                                                  │
│      volumes: [{                                                          │
│        name: 'student-data',                                             │
│        persistentVolumeClaim: {                                          │
│          claimName: `${sessionId}-pvc`                                   │
│        }                                                                  │
│      }]                                                                   │
│    }                                                                      │
│  };                                                                       │
│                                                                            │
│  await k8sCoreApi.createNamespacedPod('student-labs', podManifest);      │
│                                                                            │
│  C. CREATE SERVICE (ClusterIP)                                           │
│  ════════════════════════════════════════════════════════════════        │
│                                                                            │
│  const serviceManifest = {                                               │
│    apiVersion: 'v1',                                                     │
│    kind: 'Service',                                                      │
│    metadata: {                                                            │
│      name: `${sessionId}-service`,                                       │
│      namespace: 'student-labs'                                           │
│    },                                                                     │
│    spec: {                                                                │
│      selector: {                                                          │
│        session: sessionId                                                │
│      },                                                                   │
│      ports: [{                                                            │
│        name: 'novnc',                                                    │
│        protocol: 'TCP',                                                  │
│        port: 6080,                                                       │
│        targetPort: 6080                                                  │
│      }],                                                                  │
│      type: 'ClusterIP'                                                   │
│    }                                                                      │
│  };                                                                       │
│                                                                            │
│  await k8sCoreApi.createNamespacedService('student-labs', serviceManifest);│
│                                                                            │
│  D. CREATE INGRESS (HTTP Routing)                                        │
│  ════════════════════════════════════════════════════════════════        │
│                                                                            │
│  const ingressManifest = {                                               │
│    apiVersion: 'networking.k8s.io/v1',                                   │
│    kind: 'Ingress',                                                      │
│    metadata: {                                                            │
│      name: `${sessionId}-ingress`,                                       │
│      namespace: 'student-labs',                                          │
│      annotations: {                                                       │
│        'nginx.ingress.kubernetes.io/rewrite-target': '/$2',              │
│        'nginx.ingress.kubernetes.io/websocket-services': `${sessionId}-service`,│
│        'nginx.ingress.kubernetes.io/proxy-read-timeout': '3600'          │
│      }                                                                    │
│    },                                                                     │
│    spec: {                                                                │
│      ingressClassName: 'nginx',                                          │
│      rules: [{                                                            │
│        host: 'labs.152-42-156-112.nip.io',                              │
│        http: {                                                            │
│          paths: [{                                                        │
│            path: `/lab/${sessionId}(/|$)(.*)`,                           │
│            pathType: 'Prefix',                                           │
│            backend: {                                                     │
│              service: {                                                   │
│                name: `${sessionId}-service`,                             │
│                port: { number: 6080 }                                    │
│              }                                                            │
│            }                                                              │
│          }]                                                               │
│        }                                                                  │
│      }]                                                                   │
│    }                                                                      │
│  };                                                                       │
│                                                                            │
│  await k8sNetworkingApi.createNamespacedIngress('student-labs', ingressManifest);│
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Kubernetes Scheduler & kubelet                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. Scheduler selects a node with available resources                    │
│  2. kubelet on selected node pulls image from DOCR                       │
│  3. containerd creates container from image                              │
│  4. Volume plugin provisions DO Block Storage and mounts PVC             │
│  5. Pod starts, containers run startup scripts                           │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 8: Lab Pod Initialization                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Container startup sequence (from Dockerfile ENTRYPOINT):                │
│                                                                            │
│  1. Start Xvfb (virtual framebuffer):                                    │
│     Xvfb :99 -screen 0 1920x1080x24 &                                    │
│                                                                            │
│  2. Set DISPLAY environment variable:                                    │
│     export DISPLAY=:99                                                   │
│                                                                            │
│  3. Start XFCE4 desktop:                                                 │
│     startxfce4 &                                                          │
│                                                                            │
│  4. Start x11vnc (VNC server):                                           │
│     x11vnc -display :99 -forever -shared -rfbport 5900 -passwd cyberlab123 &│
│                                                                            │
│  5. Start websockify (WebSocket to VNC proxy):                           │
│     websockify --web /usr/share/novnc 6080 localhost:5900 &              │
│                                                                            │
│  6. Pod reports "Ready" status to Kubernetes                             │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 9: Backend - Save Session & Return URL                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. Create LabSession record in MongoDB:                                 │
│                                                                            │
│     const session = await LabSession.create({                            │
│       sessionId,                                                          │
│       studentId: req.user._id,                                           │
│       templateId,                                                         │
│       podName: sessionId,                                                │
│       accessUrl: `http://labs.152-42-156-112.nip.io/lab/${sessionId}/vnc.html`,│
│       status: 'active',                                                   │
│       startTime: new Date()                                              │
│     });                                                                   │
│                                                                            │
│  2. Return JSON response to frontend:                                    │
│                                                                            │
│     res.status(200).json({                                               │
│       success: true,                                                      │
│       sessionId,                                                          │
│       accessUrl: session.accessUrl,                                      │
│       message: 'Lab started successfully'                                │
│     });                                                                   │
│                                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 10: Frontend - Display Lab Access                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. Frontend receives response                                            │
│  2. Displays success message                                             │
│  3. Opens new tab or iframe with accessUrl                               │
│  4. Student sees Ubuntu desktop in browser via noVNC                     │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Networking Architecture

### Network Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTPS (Port 443)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              DigitalOcean Load Balancer (152.42.156.112)                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Forwards to NodePort/LoadBalancer Service
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         NGINX Ingress Controller (ingress-nginx namespace)               │
│                                                                           │
│  Ingress Rules:                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Host: 152-42-156-112.nip.io                                      │   │
│  │   /               → frontend-service:80 (ClusterIP)             │   │
│  │   /api/*          → backend-service:5000 (ClusterIP)            │   │
│  │                                                                   │   │
│  │ Host: labs.152-42-156-112.nip.io                                │   │
│  │   /lab/{sessionId}/* → {sessionId}-service:6080 (ClusterIP)     │   │
│  │                                                                   │   │
│  │ Host: monitoring.152-42-156-112.nip.io                          │   │
│  │   /               → grafana-service:3000 (ClusterIP)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│  Frontend Svc    │ │   Backend Svc    │ │  Lab Session Svc    │
│  (ClusterIP)     │ │   (ClusterIP)    │ │  (ClusterIP)        │
│  Port: 80        │ │   Port: 5000     │ │  Port: 6080         │
└────────┬─────────┘ └────────┬─────────┘ └──────────┬──────────┘
         │                    │                       │
         │                    │                       │
         ▼                    ▼                       ▼
┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│  Frontend Pods   │ │  Backend Pods    │ │  Lab Pod            │
│  (2 replicas)    │ │  (2 replicas)    │ │  (per student)      │
│                  │ │                  │ │                     │
│  nginx serving   │ │  Node.js API     │ │  Ubuntu Desktop     │
│  React app       │ │                  │ │  - Xvfb :99         │
│                  │ │  ServiceAccount: │ │  - XFCE4            │
│                  │ │  lab-manager     │ │  - x11vnc :5900     │
│                  │ │                  │ │  - websockify :6080 │
│                  │ │  Talks to:       │ │                     │
│                  │ │  - K8s API       │ │  Volume:            │
│                  │ │  - MongoDB Atlas │ │  /home/student      │
│                  │ │                  │ │  (5Gi PVC)          │
└──────────────────┘ └──────────────────┘ └─────────────────────┘
```

### DNS Resolution

1. Student types: `http://labs.152-42-156-112.nip.io/lab/lab-xyz-123/vnc.html`
2. DNS (nip.io) resolves to: `152.42.156.112` (Load Balancer IP)
3. Request hits Load Balancer
4. Load Balancer forwards to Ingress Controller
5. Ingress Controller uses CoreDNS to resolve service names
6. Traffic routed to appropriate ClusterIP service
7. Service load-balances to backing pods

### Network Policies & Isolation

- Each lab pod runs in the `student-labs` namespace
- Pods can communicate within namespace but isolated from `default` namespace
- Backend uses `lab-manager` ServiceAccount with RBAC permissions limited to `student-labs`
- Egress traffic from lab pods can be restricted via NetworkPolicy (optional)

---

## Frontend to Backend Flow

### Frontend Code Example

```javascript
// File: frontend/src/services/labService.js

import api from './api';

export const startLab = async (templateId) => {
  try {
    const response = await api.post('/labs/start', { templateId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// File: frontend/src/components/labs/LabCard.jsx

import { startLab } from '../../services/labService';

const handleStartLab = async () => {
  setLoading(true);
  try {
    const result = await startLab(template._id);
    // result = { success: true, sessionId: '...', accessUrl: '...' }
    
    // Open lab in new tab
    window.open(result.accessUrl, '_blank');
    
    // Or embed in iframe
    setLabUrl(result.accessUrl);
    
  } catch (error) {
    console.error('Failed to start lab:', error);
    alert(error.message);
  } finally {
    setLoading(false);
  }
};
```

### API Request Headers

```
POST /api/labs/start HTTP/1.1
Host: 152-42-156-112.nip.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY...
Content-Type: application/json
Accept: application/json

{
  "templateId": "ubuntu-desktop-basic"
}
```

### API Response

```json
{
  "success": true,
  "sessionId": "lab-6501234567890-1698246789123",
  "accessUrl": "http://labs.152-42-156-112.nip.io/lab/lab-6501234567890-1698246789123/vnc.html",
  "message": "Lab started successfully",
  "estimatedReadyTime": 30
}
```

---

## Backend to Kubernetes API

### Authentication & Authorization

Backend authenticates to Kubernetes using ServiceAccount:

```yaml
# File: kubernetes/infrastructure/rbac.yaml

apiVersion: v1
kind: ServiceAccount
metadata:
  name: lab-manager
  namespace: default

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: lab-manager-role
  namespace: student-labs
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "persistentvolumeclaims"]
    verbs: ["create", "get", "list", "delete", "watch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["ingresses"]
    verbs: ["create", "get", "list", "delete", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: lab-manager-binding
  namespace: student-labs
subjects:
  - kind: ServiceAccount
    name: lab-manager
    namespace: default
roleRef:
  kind: Role
  name: lab-manager-role
  apiGroup: rbac.authorization.k8s.io
```

### Backend Kubernetes Client Setup

```javascript
// File: backend/src/services/k8sService.js

const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();

// Load config from in-cluster service account
kc.loadFromCluster();

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

module.exports = {
  k8sCoreApi,
  k8sAppsApi,
  k8sNetworkingApi
};
```

### Example: Delete Lab Resources

```javascript
// File: backend/src/controllers/labController.js

exports.terminateLab = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Find session in database
    const session = await LabSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Delete Kubernetes resources
    const namespace = 'student-labs';
    
    // Delete Ingress
    await k8sNetworkingApi.deleteNamespacedIngress(
      `${sessionId}-ingress`,
      namespace
    );
    
    // Delete Service
    await k8sCoreApi.deleteNamespacedService(
      `${sessionId}-service`,
      namespace
    );
    
    // Delete Pod
    await k8sCoreApi.deleteNamespacedPod(
      sessionId,
      namespace
    );
    
    // Optionally delete PVC (or keep for data retention)
    // await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(
    //   `${sessionId}-pvc`,
    //   namespace
    // );
    
    // Update session status
    session.status = 'terminated';
    session.endTime = new Date();
    await session.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Lab terminated successfully' 
    });
    
  } catch (error) {
    console.error('Error terminating lab:', error);
    res.status(500).json({ 
      message: 'Failed to terminate lab', 
      error: error.message 
    });
  }
};
```

---

## Lab Pod Internal Architecture

### Container Image Structure

```dockerfile
# File: docker/ubuntu-desktop/Dockerfile

FROM ubuntu:22.04

# Install desktop environment
RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-terminal \
    x11vnc \
    xvfb \
    websockify \
    novnc \
    supervisor \
    firefox \
    vim \
    net-tools \
    iputils-ping \
    curl \
    wget

# Setup noVNC
RUN git clone https://github.com/novnc/noVNC.git /usr/share/novnc && \
    git clone https://github.com/novnc/websockify /usr/share/websockify && \
    ln -s /usr/share/novnc/vnc.html /usr/share/novnc/index.html

# Create student user
RUN useradd -m -s /bin/bash student && \
    echo "student:cyberlab" | chpasswd && \
    usermod -aG sudo student

# Setup startup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5900 6080

USER student
WORKDIR /home/student

ENTRYPOINT ["/entrypoint.sh"]
```

### Startup Script

```bash
# File: docker/ubuntu-desktop/entrypoint.sh

#!/bin/bash

# Start virtual framebuffer
Xvfb :99 -screen 0 ${RESOLUTION:-1920x1080}x24 &
export DISPLAY=:99

# Wait for X server
sleep 2

# Start XFCE desktop
startxfce4 &

# Start VNC server
x11vnc -display :99 \
       -forever \
       -shared \
       -rfbport 5900 \
       -passwd ${VNC_PASSWORD:-cyberlab123} &

# Start websockify (WebSocket proxy to VNC)
websockify --web /usr/share/novnc 6080 localhost:5900 &

# Keep container running
tail -f /dev/null
```

### Resource Limits

Each lab pod is configured with:
- **CPU Request**: 1 core (1000m)
- **CPU Limit**: 2 cores (2000m)
- **Memory Request**: 2Gi
- **Memory Limit**: 4Gi
- **Storage**: 5Gi PVC per session

---

## Storage & Persistence

### PVC Lifecycle

1. **Creation**: PVC created when lab starts
2. **Binding**: Kubernetes provisions DO Block Storage volume
3. **Mounting**: Volume mounted to `/home/student` in pod
4. **Usage**: Student saves files, which persist across pod restarts
5. **Retention**: PVC can be retained after pod deletion for data recovery
6. **Deletion**: Manual or automatic cleanup based on policy

### Storage Class

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: do-block-storage
provisioner: dobs.csi.digitalocean.com
parameters:
  type: pd-standard
allowVolumeExpansion: true
```

### Data Persistence Example

```bash
# Inside lab pod
student@lab-xyz-123:~$ pwd
/home/student

student@lab-xyz-123:~$ echo "My lab work" > notes.txt
student@lab-xyz-123:~$ ls -lh
total 4.0K
-rw-r--r-- 1 student student 12 Oct 25 10:30 notes.txt

# Pod is deleted and recreated (same PVC)
# Notes.txt persists because /home/student is backed by PVC
```

---

## Security & Isolation

### Multi-Layered Security

1. **Namespace Isolation**: Labs run in dedicated `student-labs` namespace
2. **RBAC**: Backend ServiceAccount has minimal permissions
3. **Network Policies**: Optional isolation of pod-to-pod traffic
4. **Resource Quotas**: Prevent resource exhaustion
5. **Pod Security Standards**: Restricted execution (non-root when possible)
6. **JWT Authentication**: All API requests authenticated
7. **TLS/HTTPS**: Encrypted traffic (recommended for production)

### Resource Quota Example

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: student-labs-quota
  namespace: student-labs
spec:
  hard:
    requests.cpu: "50"      # Max 50 CPUs total
    requests.memory: 100Gi  # Max 100GB RAM total
    persistentvolumeclaims: "100"  # Max 100 PVCs
    pods: "100"             # Max 100 pods
```

---

## Monitoring & Observability

### Prometheus Metrics

Prometheus scrapes metrics from:
- **Node Exporter**: CPU, memory, disk, network per node
- **Kube State Metrics**: Pod count, resource usage, events
- **Application Metrics**: Backend API response times, error rates

### Example Prometheus Queries

```promql
# Number of active lab pods
count(kube_pod_info{namespace="student-labs", pod=~"lab-.*"})

# CPU usage by lab pod
sum(rate(container_cpu_usage_seconds_total{namespace="student-labs"}[5m])) by (pod)

# Memory usage by lab pod
sum(container_memory_working_set_bytes{namespace="student-labs"}) by (pod)

# PVC usage
kubelet_volume_stats_used_bytes{namespace="student-labs"}
```

### Grafana Dashboards

Access Grafana at: `http://monitoring.152-42-156-112.nip.io`

Default credentials: `admin / admin123`

**Available Dashboards:**
- Cluster Overview
- Node Metrics
- Lab Pod Usage
- Student Activity
- API Performance

---

## Troubleshooting Common Issues

### Issue 1: Pod stuck in "Pending" state

**Symptoms:**
```bash
kubectl get pods -n student-labs
NAME              READY   STATUS    RESTARTS   AGE
lab-xyz-123       0/1     Pending   0          5m
```

**Diagnosis:**
```bash
kubectl describe pod lab-xyz-123 -n student-labs
```

**Common Causes:**
- Insufficient node resources (CPU/memory)
- PVC provisioning failure
- Image pull errors

**Solutions:**
- Scale cluster nodes
- Check PVC status: `kubectl get pvc -n student-labs`
- Verify registry credentials

---

### Issue 2: Cannot access noVNC

**Symptoms:**
- Browser shows "Unable to connect"
- 502 Bad Gateway error

**Diagnosis:**
```bash
# Check pod status
kubectl get pod lab-xyz-123 -n student-labs

# Check pod logs
kubectl logs lab-xyz-123 -n student-labs

# Check service
kubectl get svc lab-xyz-123-service -n student-labs

# Check ingress
kubectl get ingress lab-xyz-123-ingress -n student-labs
```

**Common Causes:**
- Pod not ready
- websockify not started
- Ingress misconfiguration

**Solutions:**
- Wait for pod to be Ready (1/1)
- Check container logs for startup errors
- Verify ingress annotations for WebSocket support

---

### Issue 3: PVC not mounting

**Symptoms:**
```
Events:
  Warning  FailedMount  5s  kubelet  Unable to attach or mount volumes
```

**Diagnosis:**
```bash
kubectl describe pvc lab-xyz-123-pvc -n student-labs
kubectl get pv
```

**Solutions:**
- Ensure DO API token is configured
- Check CSI driver is installed
- Verify storage class exists

---

### Issue 4: Backend cannot create resources

**Symptoms:**
- API returns 500 error
- Backend logs show "Forbidden" or "Unauthorized"

**Diagnosis:**
```bash
# Check ServiceAccount
kubectl get sa lab-manager -n default

# Check RoleBinding
kubectl get rolebinding -n student-labs

# Test permissions
kubectl auth can-i create pods --as=system:serviceaccount:default:lab-manager -n student-labs
```

**Solutions:**
- Verify RBAC is configured correctly
- Ensure backend deployment uses correct ServiceAccount
- Check backend is running in correct namespace

---

## Summary

This guide covered the complete technical flow of CyberLab:

1. **Frontend** sends authenticated request to backend API
2. **NGINX Ingress** routes traffic to backend service
3. **Backend** creates Kubernetes resources (PVC, Pod, Service, Ingress)
4. **Kubernetes** schedules pod, provisions storage, and configures networking
5. **Lab Pod** initializes desktop environment and exposes noVNC
6. **Student** accesses isolated Ubuntu desktop through browser
7. **Monitoring** tracks usage and health across the platform

The system leverages **CNCF cloud-native tools** (Kubernetes, Prometheus, containerd, CoreDNS) to deliver scalable, secure, and automated cybersecurity training environments.
