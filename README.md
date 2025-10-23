# CyberLab - Online Lab Environment# CyberLab - On-Demand Lab Environment for LMS



> **Complete Browser-Based Virtual Lab Platform on DigitalOcean Kubernetes**Provides each student with their own Ubuntu desktop (graphical), accessible directly through a web browser. All desktops are containerized and orchestrated on a Kubernetes cluster.



A production-ready online lab environment that provides students with isolated Ubuntu desktop sessions accessible through web browsers. Built with modern DevOps practices including GitOps, CI/CD automation, and comprehensive monitoring.## 🎯 System Architecture (🔒 Secure with HTTPS)



---```

┌─────────────────────────────────────────────────────────────┐

## 📋 Table of Contents│                      STUDENT BROWSER                         │

│  https://152-42-156-112.nip.io (Main App - HTTPS)          │

# CyberLab - Online Lab Environment

> Complete browser-based virtual lab platform running on DigitalOcean Kubernetes (DOKS).

This repository contains the source and deployment manifests for CyberLab — a cloud-native platform that provides students with isolated Ubuntu desktop sessions (XFCE) accessible through a browser (noVNC). The system uses GitOps with ArgoCD and CI/CD with GitHub Actions.

---

## Table of Contents

- [System Overview](#system-overview)

```bash
cd backend
npm install
cp .env.example .env
# edit .env
npm run dev
```

### Frontend (local)

```bash
cd frontend
npm install
cp .env.example .env
# edit VITE_API_URL in .env
npm run dev
```

---

## Troubleshooting (common checks)

- Pods: `kubectl get pods -A`
- Ingress services: `kubectl get ingress -A`
- LoadBalancer IP: `kubectl get svc -n ingress-nginx`
- Backend logs: `kubectl logs deployment/backend -n default`
- ArgoCD apps: `kubectl get applications -n argocd`

---

## Contributing

Contributions welcome. Open PRs against `main` or file issues for bugs and feature requests.

---

## License

MIT

- **Container Registry:** DigitalOcean Container Registry (DOCR)docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest .

docker push registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest

### **CI/CD & GitOps**```

- **CI/CD:** GitHub Actions

- **GitOps:** ArgoCD v3.1.8**Frontend:**

- **Version Control:** GitHub```bash

- **Image Building:** Dockercd frontend

npm run build

### **Monitoring**docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest .

- **Metrics:** Prometheus v2.48.0docker push registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest

- **Visualization:** Grafana 10.2.0```

- **Node Metrics:** Node Exporter (DaemonSet)

- **Cluster Metrics:** Kube State Metrics### 4. Deploy to Kubernetes



### **CNCF Tools Used****Create Namespace:**

- ✅ **Kubernetes** - Container orchestration```bash

- ✅ **Prometheus** - Metrics and monitoringkubectl apply -f kubernetes/infrastructure/namespaces.yaml

- ✅ **Helm** - Package management```

- ✅ **CoreDNS** - DNS and service discovery

- ✅ **containerd** - Container runtime**Create RBAC:**

```bash
# CyberLab — On-Demand Online Lab Environment

Browser-accessible Ubuntu desktop labs, containerized and orchestrated on DigitalOcean Kubernetes (DOKS). Each student gets an isolated Ubuntu desktop (XFCE) accessible through a browser via noVNC. The platform uses GitOps (ArgoCD) and CI/CD (GitHub Actions) and includes monitoring with Prometheus and Grafana.

---

## Table of Contents

- [System overview](#system-overview)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Components](#components)
- [Infrastructure](#infrastructure)
- [CI/CD & GitOps](#cicd--gitops)
- [Local development](#local-development)
- [Generate architecture diagram](#generate-architecture-diagram)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## System overview

CyberLab provides on-demand, containerized Ubuntu desktop environments for students. Each lab session typically consists of Kubernetes resources (Pod, PVC, Service, Ingress) and is created and managed by the backend using the Kubernetes API.

Key features:
- Browser-based Ubuntu desktops via noVNC
- Per-student persistent storage (PVCs)
- JWT authentication and role-based access
- GitOps with ArgoCD
- CI builds + image pushes via GitHub Actions
- Monitoring with Prometheus & Grafana

---

## Architecture

High-level flow:
1. User (student or admin) accesses the frontend in their browser.
2. Traffic hits a DigitalOcean Load Balancer, then an NGINX Ingress Controller.
3. Ingress routes requests to frontend and backend services.
4. Backend persists state to MongoDB Atlas and talks to the Kubernetes API to create lab pods in the `student-labs` namespace.
5. Lab pods expose noVNC/websockify; each session mounts a PVC backed by DigitalOcean Block Storage.
6. Prometheus scrapes metrics; Grafana visualizes dashboards.

---

## Tech stack

- Frontend: React (Vite), Tailwind CSS
- Backend: Node.js (Express), Mongoose
- Kubernetes: DigitalOcean Kubernetes (DOKS)
- Ingress: NGINX Ingress Controller
- Storage: DigitalOcean Block Storage (PVCs)
- Registry: DigitalOcean Container Registry (DOCR)
- CI: GitHub Actions
- GitOps: ArgoCD
- Monitoring: Prometheus, Grafana, Node Exporter, Kube State Metrics
- DB: MongoDB Atlas

---

## Components

### Frontend
- Path: `frontend/`
- Build: Vite bundle
- Replicas: typically 2

### Backend
- Path: `backend/`
- Responsibilities: authentication, lab lifecycle orchestration, Kubernetes API interactions
- ServiceAccount: `lab-manager` — RBAC limited to `student-labs` for pod/service/ingress/pvc operations

### Lab pods (Ubuntu desktop)
- Base image: `docker/ubuntu-desktop/Dockerfile`
- Services inside pod: x11vnc, websockify, noVNC, Xvfb, XFCE4
- PVC mounted at `/home/student`
- noVNC access path: `/lab/{sessionId}/websockify`

### Database
- Provider: MongoDB Atlas
- Models: Student, LabTemplate, LabSession

---

## Infrastructure (example)

- Cluster: DigitalOcean Kubernetes (example node type: `s-2vcpu-4gb`)
- Example LoadBalancer IP: `152.42.156.112` (replace with your LB IP)
- Namespaces: `default`, `student-labs`, `monitoring`, `argocd`, `ingress-nginx`

Note: TLS and DNS setup depend on your domain and certificate provider. `.nip.io` is useful for demos but has limitations with rate-limited ACME issuers.

---

## CI/CD & GitOps

- GitHub Actions workflows live in `.github/workflows/` (backend, frontend, ubuntu-desktop image builds).
- Typical workflow steps: checkout, authenticate with DOCR, build image, tag & push, optionally trigger ArgoCD sync.
- ArgoCD watches `kubernetes/` manifests and applies them; applications are configured with automated sync, prune and self-heal where appropriate.

---

## Local development

Backend (dev):
```
cd backend
npm install
cp .env.example .env
# edit .env (DB, JWT secret, DO settings)
npm run dev
```

Frontend (dev):
```
cd frontend
npm install
cp .env.example .env
# set VITE_API_URL
npm run dev
```

---

## Generate architecture diagram

An architecture-as-code diagram generator is included at `architecture-diagram.py` (uses the Python `diagrams` package).

Prerequisites:
- Python (3.8+)
- `pip install diagrams`
- Graphviz installed and `dot` available on PATH (see `INSTALL_GRAPHVIZ.md` for Windows instructions).

To generate the diagram (PNG/SVG):
```
python architecture-diagram.py
```

If rendering fails with a Graphviz error (ExecutableNotFound), install Graphviz and ensure `dot` is on PATH, then re-run the script.

---

## Troubleshooting

- Check pods and resources:
  - kubectl get pods -A
  - kubectl get svc -n ingress-nginx
  - kubectl logs deployment/backend -n default

- Common issues:
  - Graphviz not installed → diagram rendering fails (see `INSTALL_GRAPHVIZ.md`).
  - Duplicate key error when creating Student records → ensure unique indexes and validate incoming payloads.
  - Ingress/LoadBalancer issues → check cloud provider LB health and nginx ingress controller logs.

---

## Access (example URLs)

- Frontend: http://<LB_IP>.nip.io
- Backend API: http://<LB_IP>.nip.io/api
- Lab sessions (noVNC): http://labs.<LB_IP>.nip.io/lab/{sessionId}/vnc.html
- Grafana: http://monitoring.<LB_IP>.nip.io

Replace <LB_IP> with your LoadBalancer IP.

---

## License

MIT


│   student: req.student._id,                   // MongoDB ObjectId        │

### RBAC (Role-Based Access Control)│   labTemplate: null,                          // Simple mode (no template)│

│   podName: `lab-${studentId}-${Date.now()}`,  // Unique pod name         │

**ServiceAccount:** `lab-manager`│            // Example: lab-507f1f77bcf86cd799439011-1735324800           │

│   namespace: 'student-labs',                                             │

**Permissions (in student-labs namespace):**│   status: 'pending',                          // Initial state            │

```yaml│   autoShutdownTime: new Date(Date.now() + 120 * 60000)  // +2 hours      │

Resources: pods, services, persistentvolumeclaims, ingresses│ });                                                                      │

Verbs: create, get, list, delete, patch│                                                                           │

```│ 💾 Saved to MongoDB Atlas                                                │

│ 📊 Session ID generated: 676c12345abcdef987654321                        │

**Purpose:** Allow backend pods to create/delete lab resources dynamically└────────────────────────────┬─────────────────────────────────────────────┘

                             │

---                             ▼

┌──────────────────────────────────────────────────────────────────────────┐

## 🔄 CI/CD Pipeline│ STEP 7: K8s Service - Initialize API Client                              │

├──────────────────────────────────────────────────────────────────────────┤

### GitHub Actions Workflows│ File: backend/src/services/k8sService.js:1-13                            │

│                                                                           │

Located in `.github/workflows/`│ const kc = new k8s.KubeConfig();                                         │

│ if (process.env.NODE_ENV === 'production') {                             │

### 1. Backend Pipeline (`backend.yml`)│   kc.loadFromCluster();  // Use ServiceAccount: lab-manager              │

│ } else {                                                                 │

**Trigger:** Push to `main` branch with changes in `backend/**` or `docker/backend/**`│   kc.loadFromDefault();  // Use local kubeconfig                         │

│ }                                                                        │

**Steps:**│                                                                           │

```yaml│ const k8sApi = kc.makeApiClient(k8s.CoreV1Api);                          │

1. Checkout Code│                                                                           │

   - Uses: actions/checkout@v2│ 🔐 RBAC Permissions (lab-manager ServiceAccount):                        │

│    • Can create/delete pods in student-labs namespace                    │

2. Login to DigitalOcean Container Registry│    • Can create/delete services in student-labs namespace                │

   - Uses: digitalocean/action-doctl@v2│    • Can read nodes (to get public IP)                                   │

   - Authenticates with DIGITALOCEAN_ACCESS_TOKEN│    • CANNOT access other namespaces                                      │

└────────────────────────────┬─────────────────────────────────────────────┘

3. Build Docker Image                             │

   - Context: ./backend                             ▼

   - Dockerfile: ./docker/backend/Dockerfile┌──────────────────────────────────────────────────────────────────────────┐

   - Image: registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest│ STEP 8: K8s Service - Build Pod Manifest                                 │

├──────────────────────────────────────────────────────────────────────────┤

4. Push to Registry│ File: backend/src/services/k8sService.js:38-82                           │

   - Push image with :latest tag│                                                                           │

   - Push image with :$GITHUB_SHA tag (version tracking)│ const podManifest = {                                                    │

│   apiVersion: 'v1',                                                      │

5. Trigger ArgoCD Sync (Optional)│   kind: 'Pod',                                                           │

   - ArgoCD auto-sync enabled (happens automatically)│   metadata: {                                                            │

```│     name: 'lab-507f1f77bcf86cd799439011-1735324800',                     │

│     namespace: 'student-labs',                                           │

**Environment Variables:**│     labels: {                                                            │

- `DIGITALOCEAN_ACCESS_TOKEN` (Secret)│       app: 'student-lab',                                                │

- `REGISTRY_NAME=cyberlab-registry`│       student: '507f1f77bcf86cd799439011',                               │

│       session: '676c12345abcdef987654321'   // ⚡ CRITICAL FOR ISOLATION │

### 2. Frontend Pipeline (`frontend.yml`)│     }                                                                    │

│   },                                                                     │

**Trigger:** Push to `main` branch with changes in `frontend/**` or `docker/frontend/**`│   spec: {                                                                │

│     imagePullSecrets: [{ name: 'cyberlab-registry' }],                   │

**Steps:**│     containers: [{                                                       │

```yaml│       name: 'ubuntu-desktop',                                            │

1. Checkout Code│       image: 'registry.digitalocean.com/.../ubuntu-desktop-lab:latest',  │

│       ports: [                                                           │

2. Login to DigitalOcean Container Registry│         { containerPort: 5901, name: 'vnc' },     // x11vnc               │

│         { containerPort: 6080, name: 'novnc' }    // noVNC web interface │

3. Build Docker Image│       ],                                                                 │

   - Context: ./frontend│       resources: {                                                       │

   - Dockerfile: ./docker/frontend/Dockerfile│         requests: { memory: '1Gi', cpu: '500m' },                        │

   - Build Args: VITE_API_URL│         limits: { memory: '1Gi', cpu: '500m' }                           │

   - Image: registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest│       },                                                                 │

│       env: [                                                             │

4. Push to Registry│         { name: 'VNC_PASSWORD', value: 'student123' },                   │

   - Tag: latest, $GITHUB_SHA│         { name: 'STUDENT_ID', value: '507f1f77bcf86cd799439011' }        │

```│       ]                                                                  │

│     }],                                                                  │

### 3. Ubuntu Desktop Pipeline (`ubuntu-desktop.yml`)│     restartPolicy: 'Never'  // Don't auto-restart on failure             │

│   }                                                                      │

**Trigger:** Push to `main` branch with changes in `docker/ubuntu-desktop/**`│ };                                                                       │

└────────────────────────────┬─────────────────────────────────────────────┘

**Steps:**                             │

```yaml                             ▼

1. Checkout Code┌──────────────────────────────────────────────────────────────────────────┐

│ STEP 9: K8s Service - Create Pod in Cluster                              │

2. Login to DigitalOcean Container Registry├──────────────────────────────────────────────────────────────────────────┤

│ File: backend/src/services/k8sService.js:87-91                           │

3. Build Docker Image│                                                                           │

   - Context: ./docker/ubuntu-desktop│ const createPodResponse = await k8sApi.createNamespacedPod({             │

   - Image: registry.digitalocean.com/cyberlab-registry/ubuntu-desktop:latest│   namespace: 'student-labs',                                             │

│   body: podManifest                                                      │

4. Push to Registry│ });                                                                      │

   - Tag: latest, $GITHUB_SHA│                                                                           │

```│ ✅ Pod created successfully!                                             │

│                                                                           │

**Build Time:** ~10-15 minutes (large image with desktop environment)│ 🔄 Kubernetes Scheduler Actions:                                         │

│    1. Assigns pod to available worker node                               │

### Docker Image Pull Policy│    2. Node pulls image from registry (if not cached)                     │

│    3. Creates container from image                                       │

All deployments use:│    4. Starts container processes (Xvfb, x11vnc, noVNC, XFCE)             │

```yaml│    5. Pod status: Pending → ContainerCreating → Running (~30 seconds)    │

imagePullPolicy: Always└────────────────────────────┬─────────────────────────────────────────────┘

```                             │

                             ▼

This ensures pods always pull the latest image from the registry on restart.┌──────────────────────────────────────────────────────────────────────────┐

│ STEP 10: K8s Service - Generate Random NodePort                          │

---├──────────────────────────────────────────────────────────────────────────┤

│ File: backend/src/services/k8sService.js:93-94                           │

## 🚀 GitOps Workflow│                                                                           │

│ const nodePort = Math.floor(Math.random() * (32767 - 30000) + 30000);    │

### ArgoCD Setup│ // Result example: 31245                                                 │

│                                                                           │

**Version:** v3.1.8│ 💡 Why random ports?                                                     │

│    • Kubernetes NodePort range: 30000-32767 (2,768 available ports)      │

**Installation:**│    • Random allocation prevents conflicts                                │

```bash│    • Each student gets unique external access port                       │

kubectl create namespace argocd│    • If port taken, Kubernetes API returns error → retry with new random │

kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml└────────────────────────────┬─────────────────────────────────────────────┘

```                             │

                             ▼

**Access:**┌──────────────────────────────────────────────────────────────────────────┐

- URL: `http://argocd.152-42-156-112.nip.io`│ STEP 11: K8s Service - Create NodePort Service                           │

- Default User: `admin`├──────────────────────────────────────────────────────────────────────────┤

- Password: Retrieved with `kubectl -n argocd get secret argocd-initial-admin-secret`│ File: backend/src/services/k8sService.js:97-126                          │

│                                                                           │

### ArgoCD Applications│ const serviceManifest = {                                                │

│   apiVersion: 'v1',                                                      │

**1. Frontend Application**│   kind: 'Service',                                                       │

```yaml│   metadata: {                                                            │

apiVersion: argoproj.io/v1alpha1│     name: 'svc-lab-507f1f77bcf86cd799439011-1735324800',                 │

kind: Application│     namespace: 'student-labs'                                            │

metadata:│   },                                                                     │

  name: cyberlab-frontend│   spec: {                                                                │

  namespace: argocd│     type: 'NodePort',                                                    │

spec:│     selector: {                                                          │

  project: default│       app: 'student-lab',                                                │

  source:│       session: '676c12345abcdef987654321'  // ⚡ ISOLATION MECHANISM     │

    repoURL: https://github.com/0019-KDU/online-lab-env│     },                                                                   │

    targetRevision: main│     ports: [{                                                            │

    path: kubernetes/frontend│       port: 6080,           // Service internal port                     │

  destination:│       targetPort: 6080,     // Container port (noVNC listens here)       │

    server: https://kubernetes.default.svc│       nodePort: 31245,      // External port on ALL cluster nodes        │

    namespace: default│       protocol: 'TCP',                                                   │

  syncPolicy:│       name: 'novnc'                                                      │

    automated:│     }]                                                                   │

      prune: true│   }                                                                      │

      selfHeal: true│ };                                                                       │

```│                                                                           │

│ await k8sApi.createNamespacedService({                                   │

**2. Backend Application**│   namespace: 'student-labs',                                             │

```yaml│   body: serviceManifest                                                  │

apiVersion: argoproj.io/v1alpha1│ });                                                                      │

kind: Application│                                                                           │

metadata:│ ✅ Service created successfully!                                         │

  name: cyberlab-backend│                                                                           │

  namespace: argocd│ 🔐 HOW ISOLATION WORKS:                                                  │

spec:│    The service selector ONLY matches pods with:                          │

  project: default│    • app: 'student-lab' AND                                              │

  source:│    • session: '676c12345abcdef987654321' (unique to this student!)       │

    repoURL: https://github.com/0019-KDU/online-lab-env│                                                                           │

    targetRevision: main│    Even if 100 students have running labs, traffic to NodePort 31245     │

    path: kubernetes/backend│    routes ONLY to the pod with matching session label.                   │

  destination:└────────────────────────────┬─────────────────────────────────────────────┘

    server: https://kubernetes.default.svc                             │

    namespace: default                             ▼

  syncPolicy:┌──────────────────────────────────────────────────────────────────────────┐

    automated:│ STEP 12: K8s Service - Generate Access URL                               │

      prune: true├──────────────────────────────────────────────────────────────────────────┤

      selfHeal: true│ File: backend/src/services/k8sService.js:133-143                         │

```│                                                                           │

│ const publicIP = process.env.PUBLIC_NODE_IP || '139.59.87.226';          │

**3. Infrastructure Application**│ const accessUrl = `http://${publicIP}:${nodePort}/vnc.html?autoconnect=true`;│

```yaml│                                                                           │

apiVersion: argoproj.io/v1alpha1│ Final URL: http://139.59.87.226:31245/vnc.html?autoconnect=true          │

kind: Application│                                                                           │

metadata:│ return {                                                                 │

  name: cyberlab-infrastructure│   accessUrl: 'http://139.59.87.226:31245/vnc.html?autoconnect=true',     │

  namespace: argocd│   vncPort: 31245,                                                        │

spec:│   publicIP: '139.59.87.226'                                              │

  project: default│ };                                                                       │

  source:└────────────────────────────┬─────────────────────────────────────────────┘

    repoURL: https://github.com/0019-KDU/online-lab-env                             │

    targetRevision: main                             ▼

    path: kubernetes/infrastructure┌──────────────────────────────────────────────────────────────────────────┐

  destination:│ STEP 13: Lab Controller - Update Database                                │

    server: https://kubernetes.default.svc├──────────────────────────────────────────────────────────────────────────┤

    namespace: default│ File: backend/src/controllers/labController.js:64-67                     │

  syncPolicy:│                                                                           │

    automated:│ labSession.status = 'running';       // Update from 'pending'            │

      prune: true│ labSession.accessUrl = deploymentResult.accessUrl;                       │

      selfHeal: true│ labSession.vncPort = deploymentResult.vncPort;                           │

```│ await labSession.save();             // Persist to MongoDB               │

│                                                                           │

**4. Ingress Application**│ 💾 Updated record in MongoDB:                                            │

```yaml│ {                                                                        │

apiVersion: argoproj.io/v1alpha1│   _id: "676c12345abcdef987654321",                                       │

kind: Application│   student: "507f1f77bcf86cd799439011",                                   │

metadata:│   podName: "lab-507f1f77bcf86cd799439011-1735324800",                    │

  name: ingress-nginx│   namespace: "student-labs",                                             │

  namespace: argocd│   status: "running",                                                     │

spec:│   accessUrl: "http://139.59.87.226:31245/vnc.html?autoconnect=true",     │

  project: default│   vncPort: 31245,                                                        │

  source:│   startTime: "2024-12-27T10:00:00.000Z",                                 │

    repoURL: https://github.com/0019-KDU/online-lab-env│   autoShutdownTime: "2024-12-27T12:00:00.000Z"                           │

    targetRevision: main│ }                                                                        │

    path: kubernetes/ingress└────────────────────────────┬─────────────────────────────────────────────┘

  destination:                             │

    server: https://kubernetes.default.svc                             ▼

    namespace: ingress-nginx┌──────────────────────────────────────────────────────────────────────────┐

  syncPolicy:│ STEP 14: Lab Controller - Send Response to Frontend                      │

    automated:├──────────────────────────────────────────────────────────────────────────┤

      prune: true│ File: backend/src/controllers/labController.js:69                        │

      selfHeal: true│                                                                           │

```│ res.status(201).json(labSession);                                        │

│                                                                           │

### GitOps Flow│ HTTP Response:                                                           │

│ Status: 201 Created                                                      │

```│ Content-Type: application/json                                           │

Developer Push│ Body:                                                                    │

      ││ {                                                                        │

      ▼│   "_id": "676c12345abcdef987654321",                                     │

┌──────────────┐│   "student": "507f1f77bcf86cd799439011",                                 │

│    GitHub    ││   "podName": "lab-507f1f77bcf86cd799439011-1735324800",                  │

│  Repository  ││   "namespace": "student-labs",                                           │

└──────┬───────┘│   "status": "running",                                                   │

       ││   "accessUrl": "http://139.59.87.226:31245/vnc.html?autoconnect=true",   │

       │ Git Push│   "vncPort": 31245,                                                      │

       ▼│   "startTime": "2024-12-27T10:00:00.000Z",                               │

┌──────────────────┐│   "autoShutdownTime": "2024-12-27T12:00:00.000Z",                        │

│ GitHub Actions   ││   "createdAt": "2024-12-27T10:00:00.000Z",                               │

│ (CI Pipeline)    ││   "updatedAt": "2024-12-27T10:00:05.000Z"                                │

└──────┬───────────┘│ }                                                                        │

       │└────────────────────────────┬─────────────────────────────────────────────┘

       │ Build & Push                             │

       ▼                             ▼

┌──────────────────┐┌──────────────────────────────────────────────────────────────────────────┐

│   DOCR Registry  ││ STEP 15: Frontend - Receive Response & Update UI                         │

│  (Docker Images) │├──────────────────────────────────────────────────────────────────────────┤

└──────────────────┘│ File: frontend/src/components/labs/ActiveLabSession.jsx                  │

       ││                                                                           │

       │ Pull Image│ React component receives response and updates state:                     │

       ▼│                                                                           │

┌──────────────────┐         ┌──────────────┐│ const [session, setSession] = useState(null);                            │

│     ArgoCD       │◄────────┤   GitHub     ││ setSession(response.data);  // Update with lab session data              │

│  (GitOps Sync)   │  Watch  │  (Manifests) ││                                                                           │

└──────┬───────────┘         └──────────────┘│ State now contains:                                                      │

       ││ • session.accessUrl = "http://139.59.87.226:31245/vnc.html?..."          │

       │ Apply Manifests│ • session.status = "running"                                             │

       ▼│ • session.podName = "lab-507f1f77bcf86cd799439011-1735324800"            │

┌──────────────────┐│ • session.vncPort = 31245                                                │

│    Kubernetes    ││                                                                           │

│     Cluster      ││ UI re-renders to show active lab session                                 │

└──────────────────┘└────────────────────────────┬─────────────────────────────────────────────┘

```                             │

                             ▼

**Sync Policy:**┌──────────────────────────────────────────────────────────────────────────┐

- **Auto-Sync:** Enabled (changes applied within 3 minutes)│ STEP 16: Frontend - Embed noVNC in iframe                                │

- **Prune:** Enabled (removes resources deleted from Git)├──────────────────────────────────────────────────────────────────────────┤

- **Self-Heal:** Enabled (reverts manual cluster changes)│ <iframe                                                                  │

│   src={session.accessUrl}                                                │

**Benefits:**│   width="100%"                                                           │

- ✅ Single source of truth (Git repository)│   height="600px"                                                         │

- ✅ Automatic deployment on Git commit│   frameBorder="0"                                                        │

- ✅ Rollback capability via Git revert│   title="Lab Desktop"                                                    │

- ✅ Audit trail of all changes│ />                                                                       │

- ✅ Declarative infrastructure│                                                                           │

│ Browser HTML:                                                            │

---│ <iframe src="http://139.59.87.226:31245/vnc.html?autoconnect=true" />    │

│                                                                           │

## 📊 Monitoring│ 🌐 Browser initiates HTTP request to NodePort                            │

└────────────────────────────┬─────────────────────────────────────────────┘

### Prometheus Setup                             │

                             ▼

**Purpose:** Collect metrics from Kubernetes cluster and applications┌──────────────────────────────────────────────────────────────────────────┐

│ STEP 17: Network Path - Browser to Container                             │

**Deployment:**├──────────────────────────────────────────────────────────────────────────┤

- **Namespace:** monitoring│                                                                           │

- **Port:** 9090│ Student Browser                                                          │

- **Retention:** 15 days│      │                                                                   │

- **Storage:** 10Gi PVC│      │ HTTP GET http://139.59.87.226:31245/vnc.html                      │

│      ▼                                                                   │

**Scrape Targets:**│ Internet → DigitalOcean Firewall (allows ports 30000-32767)              │

```yaml│      │                                                                   │

- Kubernetes API Server (https://kubernetes.default.svc:443)│      ▼                                                                   │

- Kubernetes Nodes (kubelet metrics)│ Cluster Node (IP: 139.59.87.226) - Port 31245                            │

- Kubernetes Pods (cAdvisor container metrics)│      │                                                                   │

- Node Exporter (host metrics from all 5 nodes)│      │ kube-proxy routes to service                                     │

- Kube State Metrics (Kubernetes object state)│      ▼                                                                   │

```│ Service: svc-lab-507f1f77bcf86cd799439011-1735324800                     │

│      │                                                                   │

**Metrics Collected:**│      │ Selector matches: session=676c12345abcdef987654321                │

- CPU usage per pod/node│      ▼                                                                   │

- Memory usage per pod/node│ Pod: lab-507f1f77bcf86cd799439011-1735324800                             │

- Network I/O│      │                                                                   │

- Disk I/O│      │ Container port 6080 (noVNC web server)                            │

- Pod status and restarts│      ▼                                                                   │

- Ingress requests│ noVNC Web Server                                                         │

- API server latency│      │                                                                   │

│      │ Serves vnc.html + JavaScript VNC client                           │

**Configuration:**│      │ Client auto-connects (autoconnect=true query param)               │

```yaml│      ▼                                                                   │

global:│ websockify (WebSocket ↔ TCP proxy)                                       │

  scrape_interval: 30s│      │                                                                   │

  evaluation_interval: 30s│      │ Converts WebSocket protocol → VNC protocol                        │

│      ▼                                                                   │

scrape_configs:│ x11vnc (VNC server on port 5901)                                         │

  - job_name: 'kubernetes-apiservers'│      │                                                                   │

    kubernetes_sd_configs:│      │ Streams X11 display over VNC                                      │

      - role: endpoints│      ▼                                                                   │

    scheme: https│ Xvfb (Virtual X11 Display Server)                                        │

    tls_config:│      │                                                                   │

      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt│      │ Renders graphical output                                          │

      insecure_skip_verify: true│      ▼                                                                   │

    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token│ XFCE4 Desktop Environment                                                │

    │      • Window manager, panels, menus                                     │

  - job_name: 'kubernetes-nodes'│      • Firefox browser                                                   │

    kubernetes_sd_configs:│      • VSCode editor                                                     │

      - role: node│      • Terminal emulator                                                 │

    │      • File manager                                                      │

  - job_name: 'kubernetes-pods'│                                                                           │

    kubernetes_sd_configs:│ 🖱️ User input (mouse/keyboard) flows back up this chain                  │

      - role: pod└──────────────────────────────────────────────────────────────────────────┘

                                 │

  - job_name: 'node-exporter'                             ▼

    kubernetes_sd_configs:┌──────────────────────────────────────────────────────────────────────────┐

      - role: node│ STEP 18: Student Sees Desktop! 🎉                                        │

    relabel_configs:├──────────────────────────────────────────────────────────────────────────┤

      - source_labels: [__address__]│                                                                           │

        target_label: __address__│  ┌────────────────────────────────────────────────────────────┐         │

        replacement: $1:9100│  │  [Browser Window - Student View]                           │         │

    │  │  ┌──────────────────────────────────────────────────────┐  │         │

  - job_name: 'kube-state-metrics'│  │  │ 🖥️  Ubuntu 22.04 Desktop (XFCE)                      │  │         │

    static_configs:│  │  │                                                      │  │         │

      - targets: ['kube-state-metrics:8080']│  │  │  Applications  Terminal  Firefox  VSCode             │  │         │

```│  │  │  ─────────────────────────────────────────────────   │  │         │

│  │  │                                                      │  │         │

### Grafana Setup│  │  │  student@lab-507f:~$ _                               │  │         │

│  │  │                                                      │  │         │

**Purpose:** Visualize metrics with dashboards│  │  │  [Desktop icons, taskbar, file manager]              │  │         │

│  │  │                                                      │  │         │

**Deployment:**│  │  └──────────────────────────────────────────────────────┘  │         │

- **Namespace:** monitoring│  └────────────────────────────────────────────────────────────┘         │

- **Port:** 3000│                                                                           │

- **Credentials:** admin / admin123│ ✅ Student can now:                                                      │

- **Storage:** 2Gi PVC│    • Open terminal and run commands (python, npm, git, etc.)             │

│    • Install packages with sudo (sudo apt install ...)                   │

**Data Source:**│    • Write and edit code in VSCode                                       │

```yaml│    • Browse internet with Firefox                                        │

name: Prometheus│    • Upload/download files                                               │

type: prometheus│    • Full interactive Linux desktop experience!                          │

url: http://prometheus:9090│                                                                           │

access: proxy│ ⏱️ Total time elapsed: ~30-45 seconds from button click                  │

isDefault: true└──────────────────────────────────────────────────────────────────────────┘

``````



**Recommended Dashboards:**---

- **Dashboard 1860:** Node Exporter Full (host metrics)

- **Dashboard 6417:** Kubernetes Pods (pod metrics)## 🔐 Network Isolation - How Each Student Gets Their Own Desktop

- **Dashboard 8588:** Kubernetes Deployments (deployment health)

- **Dashboard 315:** Kubernetes Cluster Monitoring### **Critical Isolation Mechanism: Session-Based Label Selectors**



**Import Dashboards:**The **most important security feature** is the unique session identifier used in Service selectors.

```bash

1. Go to http://monitoring.152-42-156-112.nip.io**Code Reference:** [backend/src/services/k8sService.js:106-109](backend/src/services/k8sService.js#L106-L109)

2. Login with admin/admin123

3. Click "+" → "Import"```javascript

4. Enter dashboard ID (e.g., 1860)selector: {

5. Select Prometheus data source  app: 'student-lab',

6. Click "Import"  session: labSession._id.toString()  // ⚡ UNIQUE PER LAB SESSION

```}

```

### Node Exporter

**Why This Ensures Isolation:**

**Purpose:** Export hardware and OS metrics from nodes

1. **Unique Session ID**: Each lab session gets a unique MongoDB ObjectId (e.g., `676c12345abcdef987654321`)

**Deployment:**2. **Pod Labeling**: Pod is labeled with `session: <unique-id>` when created

- **Type:** DaemonSet (runs on all 5 nodes)3. **Service Selector**: NodePort Service ONLY routes traffic to pods matching the exact session label

- **Port:** 91004. **Result**: Traffic isolation even with 100+ concurrent student labs

- **Namespace:** monitoring

**Example Scenario:**

**Metrics Exported:**

- CPU temperature```

- Disk spaceStudent A starts lab:

- Disk I/O  → Session ID: aaa111

- Network statistics  → Pod labeled: session=aaa111

- Memory usage  → Service selector: session=aaa111

- System load  → NodePort: 31245

  → URL: http://139.59.87.226:31245/vnc.html

### Kube State Metrics  → Traffic routed ONLY to Pod with session=aaa111



**Purpose:** Export Kubernetes object state metricsStudent B starts lab:

  → Session ID: bbb222

**Deployment:**  → Pod labeled: session=bbb222

- **Type:** Deployment (1 replica)  → Service selector: session=bbb222

- **Port:** 8080  → NodePort: 31789

- **Namespace:** monitoring  → URL: http://139.59.87.226:31789/vnc.html

  → Traffic routed ONLY to Pod with session=bbb222

**Metrics Exported:**

- Pod status (Running, Pending, Failed)❌ No crosstalk possible - Kubernetes ensures selector matching

- Deployment status (Desired vs Available replicas)```

- Node status (Ready, NotReady)

- PVC status (Bound, Pending)#### **Additional Isolation Layers:**

- Job status

1. **Namespace Isolation**

---   - Student pods run in `student-labs` namespace

   - Backend/frontend run in `default` namespace

## 🌍 Access URLs   - Kubernetes NetworkPolicies can restrict cross-namespace traffic



### Production URLs2. **RBAC (Role-Based Access Control)**

   - Backend runs as `lab-manager` ServiceAccount

```   - Permissions limited to `student-labs` namespace only

Frontend:              http://152-42-156-112.nip.io   - Cannot access system namespaces or modify cluster-wide resources

Backend API:           http://152-42-156-112.nip.io/api

Lab Sessions:          http://labs.152-42-156-112.nip.io/lab/{sessionId}/vnc.html3. **Resource Quotas**

Grafana Monitoring:    http://monitoring.152-42-156-112.nip.io   - Namespace-level CPU/memory limits prevent resource exhaustion

Prometheus:            http://prometheus.152-42-156-112.nip.io   - Per-pod limits enforced by LimitRange

ArgoCD:                http://argocd.152-42-156-112.nip.io   - Prevents one student from consuming all cluster resources

```

4. **Pod-Level Isolation**

### Why .nip.io Domain?   - Each student gets dedicated container with own filesystem

   - No shared volumes between students (unless PVC implemented)

`.nip.io` is a wildcard DNS service that resolves to the IP in the domain name.   - Container security contexts can enforce UID/GID restrictions



Example:---

- `152-42-156-112.nip.io` → resolves to `152.42.156.112`

- `*.152-42-156-112.nip.io` → resolves to `152.42.156.112`### **💾 HOW PERSISTENT STORAGE WORKS (Architecture Ready)**



**Benefits:**The PVC (Persistent Volume Claim) implementation is ready in code but not yet deployed to production.

- No DNS configuration required

- Free subdomain support**Code Reference:** [backend/src/services/k8sService.js:184-217](backend/src/services/k8sService.js#L184-L217)

- Works immediately after deployment

#### **PVC Creation Flow:**

**Limitation:**

- Let's Encrypt rate limit hit (cannot use HTTPS)```javascript

- Solution: Use HTTP for now, migrate to custom domain for production HTTPSasync ensureStudentPVC(studentId, namespace, storageSize = '5Gi') {

  const pvcName = `pvc-${studentId}`;

---

  // 1. Check if PVC already exists

## 👥 User Journey  try {

    await k8sApi.readNamespacedPersistentVolumeClaim({

### Student Registration Flow      name: pvcName,

      namespace: namespace

```    });

1. Student visits http://152-42-156-112.nip.io/register    return pvcName; // PVC exists, reuse it

2. Fills form (name, email, password)  } catch (error) {

3. Frontend sends POST to /api/auth/register    // 2. PVC doesn't exist, create new one

4. Backend validates data    const pvcManifest = {

5. Backend generates studentId (STD2025XXXXXX)      apiVersion: 'v1',

6. Backend hashes password with bcrypt      kind: 'PersistentVolumeClaim',

7. Backend saves to MongoDB      metadata: {

8. Backend attempts email notification        name: pvcName,  // pvc-507f1f77bcf86cd799439011

   - If email fails → Returns credentials in API response        namespace: namespace

   - If email succeeds → Sends credentials via email      },

9. Frontend displays credentials (if email failed)      spec: {

10. Student can now login        accessModes: ['ReadWriteOnce'],  // Exclusive to one pod

```        resources: {

          requests: { storage: storageSize }  // 5Gi default

### Student Login Flow        },

        storageClass: 'do-block-storage'  // DigitalOcean volumes

```      }

1. Student visits http://152-42-156-112.nip.io/login    };

2. Enters studentId and password

3. Frontend sends POST to /api/auth/login    await k8sApi.createNamespacedPersistentVolumeClaim({

4. Backend validates credentials      namespace: namespace,

5. Backend generates JWT token (24h expiry)      body: pvcManifest

6. Backend returns token + user info    });

7. Frontend stores token in memory (Zustand)    return pvcName;

8. Frontend redirects to /dashboard  }

```}

```

### Lab Session Creation Flow

#### **Storage Lifecycle (When Fully Implemented):**

```

1. Student clicks "Start Lab" on dashboard```

2. Frontend sends POST to /api/labs/startSession 1 (First Time):

3. Backend validates JWT token  1. Student clicks "Start Lab"

4. Backend creates unique sessionId  2. ensureStudentPVC() creates pvc-{studentId}

5. Backend calls Kubernetes API:  3. DigitalOcean provisions 5Gi block storage volume

     4. Pod mounts PVC to /home/student

   a. Create PVC (1Gi persistent storage)  5. Student writes code, installs packages, creates files

      Name: lab-{sessionId}-pvc  6. Student clicks "Stop Lab"

      Namespace: student-labs  7. Pod deleted, PVC persists with all data

   

   b. Create PodSession 2 (Returning Student):

      Name: lab-{sessionId}-pod  1. Student clicks "Start Lab" again

      Namespace: student-labs  2. ensureStudentPVC() finds existing PVC

      Image: ubuntu-desktop:latest  3. New pod created, same PVC mounted to /home/student

      Mount: PVC at /home/student  4. Student sees all previous files, configurations, installed packages

      Env: DISPLAY, VNC_PASSWORD, RESOLUTION  5. Work continues seamlessly from where they left off

   ```

   c. Create Service

      Name: lab-{sessionId}-service#### **Benefits of This Approach:**

      Namespace: student-labs

      Port: 6080 → Pod:6080- **True Persistence**: Work survives pod deletion, cluster upgrades, node failures

   - **Per-Student Isolation**: Each PVC belongs to one student only (ReadWriteOnce)

   d. Create Ingress- **Cost-Effective**: Only pay for storage actually used (~$0.10/GB/month on DigitalOcean)

      Name: lab-{sessionId}-ingress- **Automatic Provisioning**: No manual intervention needed

      Namespace: student-labs- **Scalable**: Supports thousands of students with independent storage

      Host: labs.152-42-156-112.nip.io

      Path: /lab/{sessionId}/*#### **Future Enhancements:**

      Backend: lab-{sessionId}-service:6080

- **Snapshots**: Automated daily backups of student work

6. Backend saves LabSession to MongoDB- **Capacity Expansion**: Auto-expand PVC if student needs more than 5Gi

7. Backend returns accessUrl to frontend- **Data Export**: API endpoint to download entire workspace as ZIP

8. Frontend displays "Connecting..." message- **Shared Volumes**: For collaborative lab assignments (ReadWriteMany mode)

9. Frontend redirects to noVNC URL:

   http://labs.152-42-156-112.nip.io/lab/{sessionId}/vnc.html?path=/lab/{sessionId}/websockify&autoconnect=true&resize=scale&quality=9---



10. Student sees Ubuntu desktop in browser### **⏱️ TIMING BREAKDOWN**

```

Total time from button click to working desktop: **~30-45 seconds**

### Lab Session Access Flow

| Step | Component | Duration | What's Happening |

```|------|-----------|----------|------------------|

Browser Request| 1-6 | Backend Processing | 1-2s | JWT auth, DB queries, session creation |

      │| 7-12 | K8s API Calls | 2-3s | Pod/service creation, manifest processing |

      ▼| 13-16 | Response & Render | 1s | Update DB, send JSON, render iframe |

Load Balancer (152.42.156.112)| 17 | Container Startup | 25-35s | Image pull (if not cached), process startup |

      │| 18 | noVNC Connection | 2-3s | WebSocket handshake, VNC stream init |

      ▼

NGINX Ingress (routes based on path)**Optimization Opportunities:**

      │

      ▼1. **Pre-pulled Images**: If `ubuntu-desktop-lab:latest` is cached on all nodes → Reduces Step 17 to 10-15s

Lab Pod Service (student-labs namespace)2. **Pod Pre-warming**: Keep 10 "warm" pods ready for instant allocation → Near-instant startup

      │3. **NVMe Storage**: Faster disk I/O reduces boot time by 5-10s

      ▼4. **Connection Pooling**: Reuse MongoDB connections → Faster DB queries

Lab Pod (port 6080)

      │**Current Performance:**

      ▼- **Cold start** (image not cached): 40-45 seconds

websockify (WebSocket proxy)- **Warm start** (image cached): 25-30 seconds

      │- **With pre-warming**: <5 seconds (future optimization)

      ▼

x11vnc (VNC server on :5900)---

      │

      ▼### **🛡️ SECURITY CHECKPOINTS**

XFCE4 Desktop (on display :99)

      │Every request passes through multiple security layers:

      ▼

Student interacts with Ubuntu desktop via browser1. **Frontend → Backend**

```   - ✅ JWT token verification (unauthorized users blocked)

   - ✅ Token expiry check (7-day default)

### Lab Session Termination Flow   - ✅ Student account active status check



```2. **Backend → Kubernetes**

1. Student clicks "End Session" or session times out   - ✅ ServiceAccount RBAC (lab-manager can only create pods in student-labs)

2. Frontend sends DELETE to /api/labs/{sessionId}   - ✅ ImagePullSecrets (only authorized registry access)

3. Backend validates JWT token and ownership   - ✅ Namespace boundary enforcement

4. Backend calls Kubernetes API:

   - Delete Ingress3. **Service → Pod**

   - Delete Service   - ✅ Label selector isolation (traffic goes ONLY to correct pod)

   - Delete Pod   - ✅ Session ID uniqueness (no collision possible)

   - Delete PVC (optional, keep for data persistence)

5. Backend updates LabSession status to 'terminated'4. **Resource Limits**

6. Backend returns success   - ✅ Per-pod CPU/memory limits (prevents resource hogging)

7. Frontend removes session from UI   - ✅ Namespace ResourceQuota (max 100 concurrent labs)

```   - ✅ Auto-shutdown after 2 hours (prevents abandoned labs)



---5. **Network Security**

   - ✅ Firewall rules (only NodePort range 30000-32767 open)

## 🚀 Installation Guide   - ✅ NetworkPolicy ready (can block inter-pod communication)

   - ✅ TLS/HTTPS ready (Ingress supports certificates)

### Prerequisites

6. **Data Security**

- DigitalOcean account with API token   - ✅ Passwords hashed with bcrypt (10 salt rounds)

- `kubectl` installed locally   - ✅ Secrets stored in Kubernetes Secrets (not in code)

- `doctl` (DigitalOcean CLI) installed   - ✅ MongoDB connection encrypted (TLS/SSL)

- `git` installed

- GitHub account---

- MongoDB Atlas account (free tier)

### **📊 CAPACITY & SCALABILITY**

### Step 1: Create Kubernetes Cluster

**Current Cluster Configuration:**

```bash- **Nodes**: 3 x s-2vcpu-4gb (2 vCPU, 4GB RAM each)

# Login to DigitalOcean- **Total Resources**: 6 vCPUs, 12GB RAM

doctl auth init- **Concurrent Labs**: ~6-8 students (with 500m CPU, 1Gi RAM per lab)



# Create cluster**With Autoscaling Enabled:**

doctl kubernetes cluster create cyberlab-cluster \- **Min Nodes**: 3

  --region nyc1 \- **Max Nodes**: 6

  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=5" \- **Concurrent Labs**: Up to 12-16 students

  --wait

**Resource Allocation per Lab:**

# Get kubeconfig- **CPU Request**: 500m (0.5 cores)

doctl kubernetes cluster kubeconfig save cyberlab-cluster- **CPU Limit**: 500m (0.5 cores)

- **Memory Request**: 1Gi

# Verify- **Memory Limit**: 1Gi

kubectl get nodes

```**Cost Analysis:**



### Step 2: Create Container Registry| Configuration | Nodes | Monthly Cost | Students | $/Student/Month |

|---------------|-------|--------------|----------|-----------------|

```bash| Minimal | 3 x s-2vcpu-4gb | $72 | 6-8 | $9-12 |

# Create registry| Production | 5 x s-4vcpu-8gb | $200 | 40-50 | $4-5 |

doctl registry create cyberlab-registry| Enterprise | 10 x s-8vcpu-16gb | $800 | 160-200 | $4-5 |



# Login to registryCompare to traditional VDI: **$50-100/user/month** (95% cost savings!)

doctl registry login

```---



### Step 3: Clone RepositoryThis detailed flow documentation should give you everything you need for your demo presentation!



```bash## 📁 Project Structure

git clone https://github.com/0019-KDU/online-lab-env.git

cd online-lab-env```

```online-lab-env/

├── backend/                    # Node.js API server

### Step 4: Configure Secrets│   ├── src/

│   │   ├── controllers/       # API controllers

Create MongoDB Atlas cluster and get connection string.│   │   ├── models/            # Mongoose models

│   │   ├── routes/            # Express routes

Create GitHub Secrets:│   │   ├── services/          # Business logic (K8s integration)

```│   │   ├── middleware/        # Auth, validation

DIGITALOCEAN_ACCESS_TOKEN=<your-do-token>│   │   └── config/            # Database config

```│   └── Dockerfile

│

Create Kubernetes secrets:├── frontend/                   # React web app

```bash│   ├── src/

# Email secret│   │   ├── components/        # React components

kubectl create secret generic email-secret \│   │   ├── pages/             # Page components

  --from-literal=EMAIL_HOST=smtp.gmail.com \│   │   ├── services/          # API calls

  --from-literal=EMAIL_PORT=465 \│   │   ├── store/             # Zustand state

  --from-literal=EMAIL_USER=your-email@gmail.com \│   │   └── utils/             # Utilities

  --from-literal=EMAIL_PASSWORD=your-app-password \│   └── Dockerfile

  -n default│

├── docker/

# MongoDB secret│   └── ubuntu-desktop/        # Lab environment image

kubectl create secret generic mongodb-secret \│       └── Dockerfile         # Ubuntu + XFCE + noVNC

  --from-literal=MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/cyberlab' \│

  -n default└── kubernetes/                 # K8s manifests

    ├── backend/               # Backend deployment

# JWT secret    ├── frontend/              # Frontend deployment

kubectl create secret generic jwt-secret \    ├── infrastructure/        # RBAC, namespaces

  --from-literal=JWT_SECRET='your-random-secret-key' \    └── ingress/               # Ingress rules

  -n default```

```

## 🔐 Security

### Step 5: Install NGINX Ingress Controller

- **Authentication:** JWT-based authentication

```bash- **RBAC:** Kubernetes ServiceAccount with minimal permissions

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/do/deploy.yaml- **Network Isolation:** Separate namespace for lab pods

- **Registry:** Private container registry with pull secrets

# Wait for LoadBalancer IP- **Resource Limits:** CPU and memory constraints per pod

kubectl get svc -n ingress-nginx -w

## 📊 Resource Management

# Note the EXTERNAL-IP (e.g., 152.42.156.112)

```**Per Lab Pod:**

- CPU: 500m (0.5 cores)

### Step 6: Update Configuration- Memory: 1Gi

- Auto-shutdown: 2 hours

Update all occurrences of `152-42-156-112.nip.io` with your LoadBalancer IP:

**Cluster Requirements:**

```bash- Minimum: 3 nodes (s-2vcpu-4gb)

# Files to update:- Recommended: 3-5 nodes (s-4vcpu-8gb)

# - kubernetes/backend/deployment.yaml (LAB_DOMAIN, FRONTEND_URL)- Autoscaling: Enabled (min: 3, max: 6)

# - kubernetes/frontend/deployment.yaml (VITE_API_URL)

# - kubernetes/ingress/ingress.yaml (host)**Capacity:**

# - kubernetes/monitoring/ingress.yaml (host)- Current: ~6 concurrent labs

```- With upgrade: 12-40 concurrent labs



### Step 7: Deploy with ArgoCD## 🛠️ Maintenance



```bash**View Logs:**

# Install ArgoCD```bash

kubectl create namespace argocd# Backend

kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yamlkubectl logs -l app=cyberlab-backend -n default --tail=100



# Get admin password# Frontend

kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -dkubectl logs -l app=cyberlab-frontend -n default --tail=100



# Port-forward to access ArgoCD UI# Lab pods

kubectl port-forward svc/argocd-server -n argocd 8080:443kubectl logs <pod-name> -n student-labs

```

# Login at https://localhost:8080

# Username: admin**Check Status:**

# Password: <from previous command>```bash

# All resources

# Create applications (via UI or CLI)kubectl get all -n default

# - Frontend: kubernetes/frontendkubectl get all -n student-labs

# - Backend: kubernetes/backend

# - Infrastructure: kubernetes/infrastructure# Specific resources

# - Ingress: kubernetes/ingresskubectl get pods -n student-labs

```kubectl get svc -n student-labs

```

### Step 8: Deploy Monitoring

**Clean Up Failed Pods:**

```bash```bash

kubectl apply -f kubernetes/monitoring/namespace.yamlkubectl delete pods --all -n student-labs

kubectl apply -f kubernetes/monitoring/prometheus-config.yaml```

kubectl apply -f kubernetes/monitoring/prometheus-deployment.yaml

kubectl apply -f kubernetes/monitoring/grafana-deployment.yaml**Restart Services:**

kubectl apply -f kubernetes/monitoring/node-exporter.yaml```bash

kubectl apply -f kubernetes/monitoring/kube-state-metrics.yamlkubectl rollout restart deployment/backend -n default

kubectl apply -f kubernetes/monitoring/ingress.yamlkubectl rollout restart deployment/frontend -n default

``````



### Step 9: Build and Push Images## 🐛 Troubleshooting



GitHub Actions will automatically build and push images when you push to `main` branch.### Pod Not Starting (ImagePullBackOff)

```bash

Manual build:# Check registry secret

```bashkubectl get secrets -n student-labs

# Backend

docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest -f docker/backend/Dockerfile backend/# Verify image exists

docker push registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latestdoctl registry repository list-tags cyberlab-registry/ubuntu-desktop-lab



# Frontend# Recreate secret

docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest -f docker/frontend/Dockerfile frontend/kubectl create secret docker-registry cyberlab-registry \

docker push registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest  --docker-server=registry.digitalocean.com \

  --docker-username=<email> \

# Ubuntu Desktop  --docker-password=<token> \

docker build -t registry.digitalocean.com/cyberlab-registry/ubuntu-desktop:latest docker/ubuntu-desktop/  --namespace=student-labs

docker push registry.digitalocean.com/cyberlab-registry/ubuntu-desktop:latest```

```

### Pod Pending (Insufficient Resources)

### Step 10: Create Admin User```bash

# Check node resources

```bashkubectl top nodes

# Port-forward to backend pod

kubectl port-forward deployment/backend 5000:5000# Check pod resource requests

kubectl describe pod <pod-name> -n student-labs

# Run admin creation script

cd backend# Solution: Reduce resources or scale cluster

node src/scripts/createAdmin.js```

```

### Connection Timeout

### Step 11: Access Application```bash

# Verify firewall allows NodePort range (30000-32767)

```# Check if pod is running

Frontend: http://<YOUR-IP>.nip.iokubectl get pods -n student-labs

Grafana:  http://monitoring.<YOUR-IP>.nip.io

```# Check service

kubectl get svc -n student-labs

---

# Get correct node IP

## 💻 Developmentkubectl get nodes -o wide

```

### Local Development Setup

## 📝 API Endpoints

**Backend:**

```bash**Authentication:**

cd backend- `POST /api/auth/register` - Register new student

npm install- `POST /api/auth/login` - Login

cp .env.example .env- `GET /api/auth/me` - Get current user

# Edit .env with your MongoDB URI and secrets

npm run dev**Labs:**

```- `GET /api/labs/templates` - Get lab templates

- `POST /api/labs/start` - Start lab session

**Frontend:**- `GET /api/labs/my-session` - Get active session

```bash- `POST /api/labs/stop` - Stop lab session

cd frontend

npm install## � CI/CD Pipeline

cp .env.example .env

# Edit .env with backend API URLThis project uses **separate automated pipelines** for each component, deployed to DigitalOcean Kubernetes via ArgoCD (GitOps).

npm run dev

```### **Pipeline Architecture**



### Project Structure```

GitHub Actions (CI)

```    ├── Frontend Pipeline (~6 min)

online-lab-env/    └── Backend Pipeline (~8 min)

├── backend/                  # Node.js Express API          ↓

│   ├── src/    DigitalOcean Container Registry

│   │   ├── config/          # Database configuration    (registry.digitalocean.com/cyberlab-registry)

│   │   ├── controllers/     # Route controllers          ↓

│   │   ├── middleware/      # Auth middleware    ArgoCD (GitOps Sync)

│   │   ├── models/          # Mongoose models          ↓

│   │   ├── routes/          # API routes    DigitalOcean Kubernetes Cluster

│   │   ├── services/        # Kubernetes service```

│   │   ├── utils/           # Email service

│   │   ├── app.js           # Express app### **Active Pipelines**

│   │   └── server.js        # Server entry point

│   └── package.json1. **Frontend Pipeline** - React app build & deployment

├── frontend/                # React Vite app2. **Backend Pipeline** - Node.js API build & deployment

│   ├── src/

│   │   ├── components/      # React components**Note:** Ubuntu Desktop base image (`ubuntu-desktop-lab:latest`) should be built manually and pushed to DOCR. The backend dynamically creates student desktop pods from this base image using the Kubernetes API.

│   │   ├── pages/           # Page components

│   │   ├── services/        # API services### **Features**

│   │   ├── store/           # Zustand state

│   │   └── main.jsx         # React entry point✅ **DigitalOcean Native** - DOCR + DOKS integration  

│   └── package.json✅ **Automated Testing** - Lint & security scanning  

├── docker/                  # Dockerfiles✅ **Docker Build** - Multi-stage builds with layer caching  

│   ├── backend/✅ **GitOps Deployment** - ArgoCD auto-sync  

│   ├── frontend/✅ **Path Filtering** - Only build changed components  

│   └── ubuntu-desktop/✅ **Zero Downtime** - Rolling updates  

├── kubernetes/              # Kubernetes manifests

│   ├── backend/### **Workflow Status**

│   ├── frontend/

│   ├── infrastructure/![Frontend CI](https://github.com/0019-KDU/online-lab-env/actions/workflows/frontend.yml/badge.svg)

│   ├── ingress/![Backend CI](https://github.com/0019-KDU/online-lab-env/actions/workflows/backend.yml/badge.svg)

│   └── monitoring/

└── .github/### **Setup Instructions**

    └── workflows/           # CI/CD pipelines

```#### **1. Configure GitHub Secret**



---Go to: **Repository → Settings → Secrets → Actions → New secret**



## 🐛 Troubleshooting```bash

# Required secret:

### Issue: Cannot access frontendDIGITALOCEAN_TOKEN=dop_v1_xxxxxxxxxxxxx  # Your DigitalOcean API token



**Check:**# Optional (if using ArgoCD):

```bashARGOCD_SERVER=argocd.your-domain.com

# Verify pods are runningARGOCD_USERNAME=admin

kubectl get podsARGOCD_PASSWORD=your-password

```

# Check ingress

kubectl get ingress#### **2. Images Are Pushed To**



# Check LoadBalancer IP```

kubectl get svc -n ingress-nginxregistry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest

```registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest

```

**Solution:**

- Ensure EXTERNAL-IP is assigned to NGINX ingress**Ubuntu Desktop Image** (manual build):

- Verify DNS resolves: `nslookup 152-42-156-112.nip.io````bash

- Check backend logs: `kubectl logs deployment/backend`# Build and push Ubuntu Desktop image manually:

cd docker/ubuntu-desktop

### Issue: Lab session not startingdocker build -t registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest .

docker push registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest

**Check:**```

```bash

# Check student-labs namespace#### **3. Trigger Pipeline**

kubectl get pods -n student-labs

```bash

# Check backend logs# Make changes and push

kubectl logs deployment/backend -fgit add .

git commit -m "feat: your changes"

# Check RBAC permissionsgit push origin main

kubectl get sa lab-manager

kubectl get role lab-manager -n student-labs# Watch GitHub Actions: https://github.com/0019-KDU/online-lab-env/actions

``````



**Solution:**#### **4. Verify Deployment**

- Verify ServiceAccount has correct permissions

- Check if PVC is bound: `kubectl get pvc -n student-labs````bash

- Ensure ubuntu-desktop image is pulled# Check ArgoCD sync (if configured)

argocd app sync frontend-app backend-app

### Issue: Black screen in noVNC

# Watch pods

**Check:**kubectl get pods -n default -w

```bash

# Check lab pod logs# Check deployed images

kubectl logs <lab-pod-name> -n student-labskubectl describe pod <pod-name> | grep Image

```

# Check VNC process

kubectl exec <lab-pod-name> -n student-labs -- ps aux | grep vnc### **Pipeline Triggers**

```

| Changed Files | Triggered Pipeline | Duration |

**Solution:**|--------------|-------------------|----------|

- Restart lab session| `frontend/**` | Frontend only | ~6 min |

- Check if Xvfb is running| `backend/**` | Backend only | ~8 min |

- Verify permissions: `chown -R student:student /home/student`

### **Deployment Flow**

### Issue: Prometheus not scraping metrics

```

**Check:**1. Developer pushes code to GitHub

```bash        ↓

# Check Prometheus logs2. GitHub Actions detects changes (path filter)

kubectl logs deployment/prometheus -n monitoring        ↓

3. Build & Test (lint, security scan)

# Check targets in Prometheus UI        ↓

# Go to http://prometheus.<YOUR-IP>.nip.io/targets4. Docker image build

```        ↓

5. Push to DigitalOcean Container Registry

**Solution:**        ↓

- Verify `insecure_skip_verify: true` in prometheus-config.yaml6. Update kubernetes/*/deployment.yaml (image tag)

- Check ServiceAccount permissions        ↓

- Restart Prometheus: `kubectl rollout restart deployment/prometheus -n monitoring`7. ArgoCD detects manifest change

        ↓

### Issue: ArgoCD not syncing8. Rolling update in K8s cluster

        ↓

**Check:**9. Zero downtime deployment! ✅

```bash```

# Check ArgoCD application status

kubectl get applications -n argocd---



# Check ArgoCD logs## 🔒 Security: Ingress vs NodePort

kubectl logs deployment/argocd-application-controller -n argocd

```### Why We Migrated from NodePort to Ingress



**Solution:****Old Setup (NodePort)** ❌

- Verify GitHub repository is accessible```

- Check ArgoCD has correct permissionshttp://152.42.156.112:31234/vnc.html  

- Manually trigger sync in ArgoCD UIProblem: Unencrypted HTTP, random ports, 2767 ports exposed

```

---

**New Setup (Ingress)** ✅

## 📚 Additional Resources```

https://labs.152-42-156-112.nip.io/lab/{sessionId}/vnc.html

- [Kubernetes Documentation](https://kubernetes.io/docs/)Benefits: HTTPS encryption, single entry point, professional URLs

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)```

- [Prometheus Documentation](https://prometheus.io/docs/)

- [DigitalOcean Kubernetes](https://docs.digitalocean.com/products/kubernetes/)### Setup Instructions

- [noVNC GitHub](https://github.com/novnc/noVNC)

📖 **[Complete Ingress Setup Guide](./INGRESS_SETUP.md)** - 5-minute setup with screenshots

---

**Quick Start:**

## 📝 License```bash

# 1. Install NGINX Ingress Controller

MIT License - See LICENSE file for detailskubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/do/deploy.yaml



---# 2. Install cert-manager for SSL

kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

## 👨‍💻 Contributing

# 3. Apply configurations

Contributions are welcome! Please open an issue or submit a pull request.kubectl apply -f kubernetes/ingress/



---# 4. Restart backend

kubectl rollout restart deployment/backend

## 🙏 Acknowledgments

# Done! Students now access labs via HTTPS 🔒

Built with modern DevOps tools and cloud-native technologies:```

- Kubernetes & CNCF projects

- DigitalOcean cloud infrastructure**Result:**

- React & Node.js ecosystem- 🔐 All traffic encrypted with TLS 1.3

- noVNC project for browser VNC access- 🎫 Free SSL certificates from Let's Encrypt

- 🌐 Professional URLs instead of IP:RandomPort

---- 🛡️ Single secure entry point (port 443 only)



**CyberLab - Empowering hands-on learning in the cloud** 🚀---


## 📄 License

MIT
```

---

## �📄 License

MIT
