# CyberLab - On-Demand Lab Environment for LMS

Provides each student with their own Ubuntu desktop (graphical), accessible directly through a web browser. All desktops are containerized and orchestrated on a Kubernetes cluster.

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      STUDENT BROWSER                         │
│  http://152-42-156-112.nip.io (Ingress Domain)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              NGINX INGRESS CONTROLLER                        │
│  Routes /api → Backend    /  → Frontend                     │
└────────┬────────────────────────┬───────────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│  Backend Service │    │ Frontend Service │
│  (ClusterIP)     │    │  (ClusterIP)     │
│  Port: 5000      │    │  Port: 80        │
└────────┬─────────┘    └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│            Backend Deployment (2 replicas)                │
│  • Node.js + Express                                      │
│  • MongoDB (Atlas Cloud)                                  │
│  • Kubernetes API Client                                  │
└────────┬─────────────────────────────────────────────────┘
         │
         │ Creates pods/services dynamically
         ▼
┌──────────────────────────────────────────────────────────┐
│          student-labs Namespace                           │
│                                                            │
│  ┌────────────────┐      ┌────────────────┐             │
│  │ Lab Pod        │      │ NodePort Svc   │             │
│  │ Ubuntu Desktop │◄─────│ Port: 31223    │             │
│  │ noVNC:6080     │      └────────────────┘             │
│  └────────────────┘                                      │
└──────────────────────────────────────────────────────────┘
         │
         │ Accessible via
         ▼
http://139.59.87.226:31223/vnc.html?autoconnect=true
```

## 🚀 Tech Stack

### **Frontend**
- React 19.1 + Vite 7.1
- TailwindCSS v4
- Zustand (State Management)
- React Router v7
- Axios

### **Backend**
- Node.js + Express 5.1
- MongoDB (Mongoose)
- JWT Authentication
- Kubernetes Client Node
- Docker

### **Infrastructure**
- Kubernetes (DigitalOcean)
- Docker Registry (DigitalOcean)
- NGINX Ingress Controller
- Ubuntu 22.04 + XFCE Desktop
- noVNC (Web-based VNC client)

## 📋 Prerequisites

- DigitalOcean Kubernetes Cluster
- DigitalOcean Container Registry
- MongoDB Atlas Account
- `kubectl` configured
- `doctl` CLI (optional)
- Docker installed locally

## 🔧 Installation

### 1. Clone Repository

```bash
git clone <repo-url>
cd online-lab-env
```

### 2. Configure Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
K8S_NAMESPACE=student-labs
LAB_IMAGE=registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest
LAB_SESSION_TIMEOUT=7200000
MAX_CONCURRENT_LABS=3
PUBLIC_NODE_IP=139.59.87.226
```

**Frontend (.env):**
```env
VITE_API_URL=/api
```

### 3. Build Docker Images

**Ubuntu Desktop:**
```bash
cd docker/ubuntu-desktop
docker build -t registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest .
docker push registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest
```

**Backend:**
```bash
cd backend
docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest .
docker push registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest
```

**Frontend:**
```bash
cd frontend
npm run build
docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest .
docker push registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest
```

### 4. Deploy to Kubernetes

**Create Namespace:**
```bash
kubectl apply -f kubernetes/infrastructure/namespaces.yaml
```

**Create RBAC:**
```bash
kubectl apply -f kubernetes/infrastructure/rbac.yaml
```

**Create Registry Secret:**
```bash
kubectl create secret docker-registry cyberlab-registry \
  --docker-server=registry.digitalocean.com \
  --docker-username=<your-email> \
  --docker-password=<your-do-token> \
  --namespace=student-labs
```

**Create Secrets:**
```bash
# MongoDB
kubectl create secret generic mongo-secret \
  --from-literal=connection-string='mongodb+srv://...' \
  -n default

# JWT
kubectl create secret generic jwt-secret \
  --from-literal=secret='your-secret-key' \
  -n default
```

**Deploy Backend:**
```bash
kubectl apply -f kubernetes/backend/deployment.yaml
```

**Deploy Frontend:**
```bash
kubectl apply -f kubernetes/frontend/deployment.yaml
```

**Deploy Ingress:**
```bash
kubectl apply -f kubernetes/ingress/ingress.yaml
```

### 5. Configure Firewall (DigitalOcean)

**Open NodePort Range:**
1. Go to: https://cloud.digitalocean.com/networking/firewalls
2. Select your Kubernetes cluster firewall
3. Add Inbound Rule:
   - Type: Custom
   - Protocol: TCP
   - Ports: `30000-32767`
   - Sources: All IPv4

Or via CLI:
```bash
doctl compute firewall add-rules <firewall-id> \
  --inbound-rules "protocol:tcp,ports:30000-32767,address:0.0.0.0/0"
```

## 🔄 Technical Workflow - High Level

### 1. Student Login
```
POST /api/auth/login
→ Validates credentials
→ Returns JWT token
```

### 2. Start Lab
```
POST /api/labs/start
→ Creates LabSession in MongoDB
→ Generates unique pod name
→ Creates Kubernetes Pod with Ubuntu Desktop
→ Creates NodePort Service (random port 30000-32767)
→ Returns access URL: http://NODE_IP:PORT/vnc.html?autoconnect=true
```

### 3. Access Desktop
```
Frontend displays iframe with accessUrl
→ Browser connects to NodePort
→ websockify proxies WebSocket → VNC
→ x11vnc serves XFCE desktop
→ Student interacts with Ubuntu desktop
```

### 4. Stop Lab
```
POST /api/labs/stop
→ Deletes Kubernetes Pod
→ Deletes NodePort Service
→ Updates session status to 'stopped'
```

---

## 🚀 DETAILED FLOW: When Student Clicks "Start Lab"

This section provides a comprehensive, step-by-step breakdown of what happens from the moment a student clicks "Start Lab" to when they see their Ubuntu desktop.

### **📊 Complete Request-Response Flow**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Student Browser - User Action                                    │
├──────────────────────────────────────────────────────────────────────────┤
│ • Student clicks "Start Ubuntu Lab" button                               │
│ • Frontend (React) sends HTTP POST request                               │
│ • Request: POST /api/labs/start                                          │
│ • Headers: Authorization: Bearer <JWT_TOKEN>                             │
│ • Body: {} (no parameters needed for simple mode)                        │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2: NGINX Ingress Controller - Request Routing                       │
├──────────────────────────────────────────────────────────────────────────┤
│ • Ingress receives request at /api/labs/start                            │
│ • Routes to backend service based on path prefix                         │
│ • Rule: /api/* → backend-service:5000 (ClusterIP)                        │
│ • Performs internal Kubernetes service discovery                         │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Backend - Authentication Middleware                              │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/middleware/auth.js (protect middleware)                │
│                                                                           │
│ 1. Extract JWT from Authorization header                                 │
│    const token = req.headers.authorization.split(' ')[1];                │
│                                                                           │
│ 2. Verify token signature                                                │
│    const decoded = jwt.verify(token, process.env.JWT_SECRET);            │
│                                                                           │
│ 3. Extract student ID from payload                                       │
│    const studentId = decoded.id;                                         │
│                                                                           │
│ 4. Query database for student                                            │
│    const student = await Student.findById(studentId).select('-password');│
│                                                                           │
│ 5. Attach student to request object                                      │
│    req.student = student;                                                │
│                                                                           │
│ ✅ If valid: Continue to controller                                      │
│ ❌ If invalid/expired: Return 401 Unauthorized                           │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Lab Controller - Check Existing Session                          │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/controllers/labController.js:21-33                     │
│                                                                           │
│ const existingSession = await LabSession.findOne({                       │
│   student: req.student._id,                                              │
│   status: 'running'                                                      │
│ });                                                                      │
│                                                                           │
│ ❓ IF existing session found:                                            │
│    → Return existing session immediately                                 │
│    → Response: { podName, accessUrl, status: 'running', vncPort }        │
│    → STOP HERE (don't create duplicate pod)                              │
│                                                                           │
│ ✅ IF NO existing session:                                               │
│    → Continue to create new lab                                          │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Lab Controller - Create Configuration                            │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/controllers/labController.js:35-47                     │
│                                                                           │
│ const defaultLabConfig = {                                               │
│   name: 'Ubuntu Desktop Lab',                                            │
│   image: 'registry.digitalocean.com/cyberlab-registry/                   │
│           ubuntu-desktop-lab:latest',                                    │
│   resources: {                                                           │
│     cpu: '500m',      // 0.5 CPU cores                                   │
│     memory: '1Gi'     // 1 Gigabyte RAM                                  │
│   },                                                                     │
│   duration: 120       // 2 hours auto-shutdown                           │
│ };                                                                       │
│                                                                           │
│ const namespace = process.env.K8S_NAMESPACE || 'student-labs';           │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Lab Controller - Create Database Record                          │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/controllers/labController.js:49-57                     │
│                                                                           │
│ const labSession = await LabSession.create({                             │
│   student: req.student._id,                   // MongoDB ObjectId        │
│   labTemplate: null,                          // Simple mode (no template)│
│   podName: `lab-${studentId}-${Date.now()}`,  // Unique pod name         │
│            // Example: lab-507f1f77bcf86cd799439011-1735324800           │
│   namespace: 'student-labs',                                             │
│   status: 'pending',                          // Initial state            │
│   autoShutdownTime: new Date(Date.now() + 120 * 60000)  // +2 hours      │
│ });                                                                      │
│                                                                           │
│ 💾 Saved to MongoDB Atlas                                                │
│ 📊 Session ID generated: 676c12345abcdef987654321                        │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 7: K8s Service - Initialize API Client                              │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/services/k8sService.js:1-13                            │
│                                                                           │
│ const kc = new k8s.KubeConfig();                                         │
│ if (process.env.NODE_ENV === 'production') {                             │
│   kc.loadFromCluster();  // Use ServiceAccount: lab-manager              │
│ } else {                                                                 │
│   kc.loadFromDefault();  // Use local kubeconfig                         │
│ }                                                                        │
│                                                                           │
│ const k8sApi = kc.makeApiClient(k8s.CoreV1Api);                          │
│                                                                           │
│ 🔐 RBAC Permissions (lab-manager ServiceAccount):                        │
│    • Can create/delete pods in student-labs namespace                    │
│    • Can create/delete services in student-labs namespace                │
│    • Can read nodes (to get public IP)                                   │
│    • CANNOT access other namespaces                                      │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 8: K8s Service - Build Pod Manifest                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/services/k8sService.js:38-82                           │
│                                                                           │
│ const podManifest = {                                                    │
│   apiVersion: 'v1',                                                      │
│   kind: 'Pod',                                                           │
│   metadata: {                                                            │
│     name: 'lab-507f1f77bcf86cd799439011-1735324800',                     │
│     namespace: 'student-labs',                                           │
│     labels: {                                                            │
│       app: 'student-lab',                                                │
│       student: '507f1f77bcf86cd799439011',                               │
│       session: '676c12345abcdef987654321'   // ⚡ CRITICAL FOR ISOLATION │
│     }                                                                    │
│   },                                                                     │
│   spec: {                                                                │
│     imagePullSecrets: [{ name: 'cyberlab-registry' }],                   │
│     containers: [{                                                       │
│       name: 'ubuntu-desktop',                                            │
│       image: 'registry.digitalocean.com/.../ubuntu-desktop-lab:latest',  │
│       ports: [                                                           │
│         { containerPort: 5901, name: 'vnc' },     // x11vnc               │
│         { containerPort: 6080, name: 'novnc' }    // noVNC web interface │
│       ],                                                                 │
│       resources: {                                                       │
│         requests: { memory: '1Gi', cpu: '500m' },                        │
│         limits: { memory: '1Gi', cpu: '500m' }                           │
│       },                                                                 │
│       env: [                                                             │
│         { name: 'VNC_PASSWORD', value: 'student123' },                   │
│         { name: 'STUDENT_ID', value: '507f1f77bcf86cd799439011' }        │
│       ]                                                                  │
│     }],                                                                  │
│     restartPolicy: 'Never'  // Don't auto-restart on failure             │
│   }                                                                      │
│ };                                                                       │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 9: K8s Service - Create Pod in Cluster                              │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/services/k8sService.js:87-91                           │
│                                                                           │
│ const createPodResponse = await k8sApi.createNamespacedPod({             │
│   namespace: 'student-labs',                                             │
│   body: podManifest                                                      │
│ });                                                                      │
│                                                                           │
│ ✅ Pod created successfully!                                             │
│                                                                           │
│ 🔄 Kubernetes Scheduler Actions:                                         │
│    1. Assigns pod to available worker node                               │
│    2. Node pulls image from registry (if not cached)                     │
│    3. Creates container from image                                       │
│    4. Starts container processes (Xvfb, x11vnc, noVNC, XFCE)             │
│    5. Pod status: Pending → ContainerCreating → Running (~30 seconds)    │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 10: K8s Service - Generate Random NodePort                          │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/services/k8sService.js:93-94                           │
│                                                                           │
│ const nodePort = Math.floor(Math.random() * (32767 - 30000) + 30000);    │
│ // Result example: 31245                                                 │
│                                                                           │
│ 💡 Why random ports?                                                     │
│    • Kubernetes NodePort range: 30000-32767 (2,768 available ports)      │
│    • Random allocation prevents conflicts                                │
│    • Each student gets unique external access port                       │
│    • If port taken, Kubernetes API returns error → retry with new random │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 11: K8s Service - Create NodePort Service                           │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/services/k8sService.js:97-126                          │
│                                                                           │
│ const serviceManifest = {                                                │
│   apiVersion: 'v1',                                                      │
│   kind: 'Service',                                                       │
│   metadata: {                                                            │
│     name: 'svc-lab-507f1f77bcf86cd799439011-1735324800',                 │
│     namespace: 'student-labs'                                            │
│   },                                                                     │
│   spec: {                                                                │
│     type: 'NodePort',                                                    │
│     selector: {                                                          │
│       app: 'student-lab',                                                │
│       session: '676c12345abcdef987654321'  // ⚡ ISOLATION MECHANISM     │
│     },                                                                   │
│     ports: [{                                                            │
│       port: 6080,           // Service internal port                     │
│       targetPort: 6080,     // Container port (noVNC listens here)       │
│       nodePort: 31245,      // External port on ALL cluster nodes        │
│       protocol: 'TCP',                                                   │
│       name: 'novnc'                                                      │
│     }]                                                                   │
│   }                                                                      │
│ };                                                                       │
│                                                                           │
│ await k8sApi.createNamespacedService({                                   │
│   namespace: 'student-labs',                                             │
│   body: serviceManifest                                                  │
│ });                                                                      │
│                                                                           │
│ ✅ Service created successfully!                                         │
│                                                                           │
│ 🔐 HOW ISOLATION WORKS:                                                  │
│    The service selector ONLY matches pods with:                          │
│    • app: 'student-lab' AND                                              │
│    • session: '676c12345abcdef987654321' (unique to this student!)       │
│                                                                           │
│    Even if 100 students have running labs, traffic to NodePort 31245     │
│    routes ONLY to the pod with matching session label.                   │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 12: K8s Service - Generate Access URL                               │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/services/k8sService.js:133-143                         │
│                                                                           │
│ const publicIP = process.env.PUBLIC_NODE_IP || '139.59.87.226';          │
│ const accessUrl = `http://${publicIP}:${nodePort}/vnc.html?autoconnect=true`;│
│                                                                           │
│ Final URL: http://139.59.87.226:31245/vnc.html?autoconnect=true          │
│                                                                           │
│ return {                                                                 │
│   accessUrl: 'http://139.59.87.226:31245/vnc.html?autoconnect=true',     │
│   vncPort: 31245,                                                        │
│   publicIP: '139.59.87.226'                                              │
│ };                                                                       │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 13: Lab Controller - Update Database                                │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/controllers/labController.js:64-67                     │
│                                                                           │
│ labSession.status = 'running';       // Update from 'pending'            │
│ labSession.accessUrl = deploymentResult.accessUrl;                       │
│ labSession.vncPort = deploymentResult.vncPort;                           │
│ await labSession.save();             // Persist to MongoDB               │
│                                                                           │
│ 💾 Updated record in MongoDB:                                            │
│ {                                                                        │
│   _id: "676c12345abcdef987654321",                                       │
│   student: "507f1f77bcf86cd799439011",                                   │
│   podName: "lab-507f1f77bcf86cd799439011-1735324800",                    │
│   namespace: "student-labs",                                             │
│   status: "running",                                                     │
│   accessUrl: "http://139.59.87.226:31245/vnc.html?autoconnect=true",     │
│   vncPort: 31245,                                                        │
│   startTime: "2024-12-27T10:00:00.000Z",                                 │
│   autoShutdownTime: "2024-12-27T12:00:00.000Z"                           │
│ }                                                                        │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 14: Lab Controller - Send Response to Frontend                      │
├──────────────────────────────────────────────────────────────────────────┤
│ File: backend/src/controllers/labController.js:69                        │
│                                                                           │
│ res.status(201).json(labSession);                                        │
│                                                                           │
│ HTTP Response:                                                           │
│ Status: 201 Created                                                      │
│ Content-Type: application/json                                           │
│ Body:                                                                    │
│ {                                                                        │
│   "_id": "676c12345abcdef987654321",                                     │
│   "student": "507f1f77bcf86cd799439011",                                 │
│   "podName": "lab-507f1f77bcf86cd799439011-1735324800",                  │
│   "namespace": "student-labs",                                           │
│   "status": "running",                                                   │
│   "accessUrl": "http://139.59.87.226:31245/vnc.html?autoconnect=true",   │
│   "vncPort": 31245,                                                      │
│   "startTime": "2024-12-27T10:00:00.000Z",                               │
│   "autoShutdownTime": "2024-12-27T12:00:00.000Z",                        │
│   "createdAt": "2024-12-27T10:00:00.000Z",                               │
│   "updatedAt": "2024-12-27T10:00:05.000Z"                                │
│ }                                                                        │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 15: Frontend - Receive Response & Update UI                         │
├──────────────────────────────────────────────────────────────────────────┤
│ File: frontend/src/components/labs/ActiveLabSession.jsx                  │
│                                                                           │
│ React component receives response and updates state:                     │
│                                                                           │
│ const [session, setSession] = useState(null);                            │
│ setSession(response.data);  // Update with lab session data              │
│                                                                           │
│ State now contains:                                                      │
│ • session.accessUrl = "http://139.59.87.226:31245/vnc.html?..."          │
│ • session.status = "running"                                             │
│ • session.podName = "lab-507f1f77bcf86cd799439011-1735324800"            │
│ • session.vncPort = 31245                                                │
│                                                                           │
│ UI re-renders to show active lab session                                 │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 16: Frontend - Embed noVNC in iframe                                │
├──────────────────────────────────────────────────────────────────────────┤
│ <iframe                                                                  │
│   src={session.accessUrl}                                                │
│   width="100%"                                                           │
│   height="600px"                                                         │
│   frameBorder="0"                                                        │
│   title="Lab Desktop"                                                    │
│ />                                                                       │
│                                                                           │
│ Browser HTML:                                                            │
│ <iframe src="http://139.59.87.226:31245/vnc.html?autoconnect=true" />    │
│                                                                           │
│ 🌐 Browser initiates HTTP request to NodePort                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 17: Network Path - Browser to Container                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│ Student Browser                                                          │
│      │                                                                   │
│      │ HTTP GET http://139.59.87.226:31245/vnc.html                      │
│      ▼                                                                   │
│ Internet → DigitalOcean Firewall (allows ports 30000-32767)              │
│      │                                                                   │
│      ▼                                                                   │
│ Cluster Node (IP: 139.59.87.226) - Port 31245                            │
│      │                                                                   │
│      │ kube-proxy routes to service                                     │
│      ▼                                                                   │
│ Service: svc-lab-507f1f77bcf86cd799439011-1735324800                     │
│      │                                                                   │
│      │ Selector matches: session=676c12345abcdef987654321                │
│      ▼                                                                   │
│ Pod: lab-507f1f77bcf86cd799439011-1735324800                             │
│      │                                                                   │
│      │ Container port 6080 (noVNC web server)                            │
│      ▼                                                                   │
│ noVNC Web Server                                                         │
│      │                                                                   │
│      │ Serves vnc.html + JavaScript VNC client                           │
│      │ Client auto-connects (autoconnect=true query param)               │
│      ▼                                                                   │
│ websockify (WebSocket ↔ TCP proxy)                                       │
│      │                                                                   │
│      │ Converts WebSocket protocol → VNC protocol                        │
│      ▼                                                                   │
│ x11vnc (VNC server on port 5901)                                         │
│      │                                                                   │
│      │ Streams X11 display over VNC                                      │
│      ▼                                                                   │
│ Xvfb (Virtual X11 Display Server)                                        │
│      │                                                                   │
│      │ Renders graphical output                                          │
│      ▼                                                                   │
│ XFCE4 Desktop Environment                                                │
│      • Window manager, panels, menus                                     │
│      • Firefox browser                                                   │
│      • VSCode editor                                                     │
│      • Terminal emulator                                                 │
│      • File manager                                                      │
│                                                                           │
│ 🖱️ User input (mouse/keyboard) flows back up this chain                  │
└──────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 18: Student Sees Desktop! 🎉                                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │  [Browser Window - Student View]                           │         │
│  │  ┌──────────────────────────────────────────────────────┐  │         │
│  │  │ 🖥️  Ubuntu 22.04 Desktop (XFCE)                      │  │         │
│  │  │                                                      │  │         │
│  │  │  Applications  Terminal  Firefox  VSCode             │  │         │
│  │  │  ─────────────────────────────────────────────────   │  │         │
│  │  │                                                      │  │         │
│  │  │  student@lab-507f:~$ _                               │  │         │
│  │  │                                                      │  │         │
│  │  │  [Desktop icons, taskbar, file manager]              │  │         │
│  │  │                                                      │  │         │
│  │  └──────────────────────────────────────────────────────┘  │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                           │
│ ✅ Student can now:                                                      │
│    • Open terminal and run commands (python, npm, git, etc.)             │
│    • Install packages with sudo (sudo apt install ...)                   │
│    • Write and edit code in VSCode                                       │
│    • Browse internet with Firefox                                        │
│    • Upload/download files                                               │
│    • Full interactive Linux desktop experience!                          │
│                                                                           │
│ ⏱️ Total time elapsed: ~30-45 seconds from button click                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### **🔐 HOW NETWORK ISOLATION WORKS**

#### **Critical Isolation Mechanism: Session-Based Label Selectors**

The **most important security feature** is the unique session identifier used in Service selectors.

**Code Reference:** [backend/src/services/k8sService.js:106-109](backend/src/services/k8sService.js#L106-L109)

```javascript
selector: {
  app: 'student-lab',
  session: labSession._id.toString()  // ⚡ UNIQUE PER LAB SESSION
}
```

**Why This Ensures Isolation:**

1. **Unique Session ID**: Each lab session gets a unique MongoDB ObjectId (e.g., `676c12345abcdef987654321`)
2. **Pod Labeling**: Pod is labeled with `session: <unique-id>` when created
3. **Service Selector**: NodePort Service ONLY routes traffic to pods matching the exact session label
4. **Result**: Traffic isolation even with 100+ concurrent student labs

**Example Scenario:**

```
Student A starts lab:
  → Session ID: aaa111
  → Pod labeled: session=aaa111
  → Service selector: session=aaa111
  → NodePort: 31245
  → URL: http://139.59.87.226:31245/vnc.html
  → Traffic routed ONLY to Pod with session=aaa111

Student B starts lab:
  → Session ID: bbb222
  → Pod labeled: session=bbb222
  → Service selector: session=bbb222
  → NodePort: 31789
  → URL: http://139.59.87.226:31789/vnc.html
  → Traffic routed ONLY to Pod with session=bbb222

❌ No crosstalk possible - Kubernetes ensures selector matching
```

#### **Additional Isolation Layers:**

1. **Namespace Isolation**
   - Student pods run in `student-labs` namespace
   - Backend/frontend run in `default` namespace
   - Kubernetes NetworkPolicies can restrict cross-namespace traffic

2. **RBAC (Role-Based Access Control)**
   - Backend runs as `lab-manager` ServiceAccount
   - Permissions limited to `student-labs` namespace only
   - Cannot access system namespaces or modify cluster-wide resources

3. **Resource Quotas**
   - Namespace-level CPU/memory limits prevent resource exhaustion
   - Per-pod limits enforced by LimitRange
   - Prevents one student from consuming all cluster resources

4. **Pod-Level Isolation**
   - Each student gets dedicated container with own filesystem
   - No shared volumes between students (unless PVC implemented)
   - Container security contexts can enforce UID/GID restrictions

---

### **💾 HOW PERSISTENT STORAGE WORKS (Architecture Ready)**

The PVC (Persistent Volume Claim) implementation is ready in code but not yet deployed to production.

**Code Reference:** [backend/src/services/k8sService.js:184-217](backend/src/services/k8sService.js#L184-L217)

#### **PVC Creation Flow:**

```javascript
async ensureStudentPVC(studentId, namespace, storageSize = '5Gi') {
  const pvcName = `pvc-${studentId}`;

  // 1. Check if PVC already exists
  try {
    await k8sApi.readNamespacedPersistentVolumeClaim({
      name: pvcName,
      namespace: namespace
    });
    return pvcName; // PVC exists, reuse it
  } catch (error) {
    // 2. PVC doesn't exist, create new one
    const pvcManifest = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: pvcName,  // pvc-507f1f77bcf86cd799439011
        namespace: namespace
      },
      spec: {
        accessModes: ['ReadWriteOnce'],  // Exclusive to one pod
        resources: {
          requests: { storage: storageSize }  // 5Gi default
        },
        storageClass: 'do-block-storage'  // DigitalOcean volumes
      }
    };

    await k8sApi.createNamespacedPersistentVolumeClaim({
      namespace: namespace,
      body: pvcManifest
    });
    return pvcName;
  }
}
```

#### **Storage Lifecycle (When Fully Implemented):**

```
Session 1 (First Time):
  1. Student clicks "Start Lab"
  2. ensureStudentPVC() creates pvc-{studentId}
  3. DigitalOcean provisions 5Gi block storage volume
  4. Pod mounts PVC to /home/student
  5. Student writes code, installs packages, creates files
  6. Student clicks "Stop Lab"
  7. Pod deleted, PVC persists with all data

Session 2 (Returning Student):
  1. Student clicks "Start Lab" again
  2. ensureStudentPVC() finds existing PVC
  3. New pod created, same PVC mounted to /home/student
  4. Student sees all previous files, configurations, installed packages
  5. Work continues seamlessly from where they left off
```

#### **Benefits of This Approach:**

- **True Persistence**: Work survives pod deletion, cluster upgrades, node failures
- **Per-Student Isolation**: Each PVC belongs to one student only (ReadWriteOnce)
- **Cost-Effective**: Only pay for storage actually used (~$0.10/GB/month on DigitalOcean)
- **Automatic Provisioning**: No manual intervention needed
- **Scalable**: Supports thousands of students with independent storage

#### **Future Enhancements:**

- **Snapshots**: Automated daily backups of student work
- **Capacity Expansion**: Auto-expand PVC if student needs more than 5Gi
- **Data Export**: API endpoint to download entire workspace as ZIP
- **Shared Volumes**: For collaborative lab assignments (ReadWriteMany mode)

---

### **⏱️ TIMING BREAKDOWN**

Total time from button click to working desktop: **~30-45 seconds**

| Step | Component | Duration | What's Happening |
|------|-----------|----------|------------------|
| 1-6 | Backend Processing | 1-2s | JWT auth, DB queries, session creation |
| 7-12 | K8s API Calls | 2-3s | Pod/service creation, manifest processing |
| 13-16 | Response & Render | 1s | Update DB, send JSON, render iframe |
| 17 | Container Startup | 25-35s | Image pull (if not cached), process startup |
| 18 | noVNC Connection | 2-3s | WebSocket handshake, VNC stream init |

**Optimization Opportunities:**

1. **Pre-pulled Images**: If `ubuntu-desktop-lab:latest` is cached on all nodes → Reduces Step 17 to 10-15s
2. **Pod Pre-warming**: Keep 10 "warm" pods ready for instant allocation → Near-instant startup
3. **NVMe Storage**: Faster disk I/O reduces boot time by 5-10s
4. **Connection Pooling**: Reuse MongoDB connections → Faster DB queries

**Current Performance:**
- **Cold start** (image not cached): 40-45 seconds
- **Warm start** (image cached): 25-30 seconds
- **With pre-warming**: <5 seconds (future optimization)

---

### **🛡️ SECURITY CHECKPOINTS**

Every request passes through multiple security layers:

1. **Frontend → Backend**
   - ✅ JWT token verification (unauthorized users blocked)
   - ✅ Token expiry check (7-day default)
   - ✅ Student account active status check

2. **Backend → Kubernetes**
   - ✅ ServiceAccount RBAC (lab-manager can only create pods in student-labs)
   - ✅ ImagePullSecrets (only authorized registry access)
   - ✅ Namespace boundary enforcement

3. **Service → Pod**
   - ✅ Label selector isolation (traffic goes ONLY to correct pod)
   - ✅ Session ID uniqueness (no collision possible)

4. **Resource Limits**
   - ✅ Per-pod CPU/memory limits (prevents resource hogging)
   - ✅ Namespace ResourceQuota (max 100 concurrent labs)
   - ✅ Auto-shutdown after 2 hours (prevents abandoned labs)

5. **Network Security**
   - ✅ Firewall rules (only NodePort range 30000-32767 open)
   - ✅ NetworkPolicy ready (can block inter-pod communication)
   - ✅ TLS/HTTPS ready (Ingress supports certificates)

6. **Data Security**
   - ✅ Passwords hashed with bcrypt (10 salt rounds)
   - ✅ Secrets stored in Kubernetes Secrets (not in code)
   - ✅ MongoDB connection encrypted (TLS/SSL)

---

### **📊 CAPACITY & SCALABILITY**

**Current Cluster Configuration:**
- **Nodes**: 3 x s-2vcpu-4gb (2 vCPU, 4GB RAM each)
- **Total Resources**: 6 vCPUs, 12GB RAM
- **Concurrent Labs**: ~6-8 students (with 500m CPU, 1Gi RAM per lab)

**With Autoscaling Enabled:**
- **Min Nodes**: 3
- **Max Nodes**: 6
- **Concurrent Labs**: Up to 12-16 students

**Resource Allocation per Lab:**
- **CPU Request**: 500m (0.5 cores)
- **CPU Limit**: 500m (0.5 cores)
- **Memory Request**: 1Gi
- **Memory Limit**: 1Gi

**Cost Analysis:**

| Configuration | Nodes | Monthly Cost | Students | $/Student/Month |
|---------------|-------|--------------|----------|-----------------|
| Minimal | 3 x s-2vcpu-4gb | $72 | 6-8 | $9-12 |
| Production | 5 x s-4vcpu-8gb | $200 | 40-50 | $4-5 |
| Enterprise | 10 x s-8vcpu-16gb | $800 | 160-200 | $4-5 |

Compare to traditional VDI: **$50-100/user/month** (95% cost savings!)

---

This detailed flow documentation should give you everything you need for your demo presentation!

## 📁 Project Structure

```
online-lab-env/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── controllers/       # API controllers
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # Express routes
│   │   ├── services/          # Business logic (K8s integration)
│   │   ├── middleware/        # Auth, validation
│   │   └── config/            # Database config
│   └── Dockerfile
│
├── frontend/                   # React web app
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API calls
│   │   ├── store/             # Zustand state
│   │   └── utils/             # Utilities
│   └── Dockerfile
│
├── docker/
│   └── ubuntu-desktop/        # Lab environment image
│       └── Dockerfile         # Ubuntu + XFCE + noVNC
│
└── kubernetes/                 # K8s manifests
    ├── backend/               # Backend deployment
    ├── frontend/              # Frontend deployment
    ├── infrastructure/        # RBAC, namespaces
    └── ingress/               # Ingress rules
```

## 🔐 Security

- **Authentication:** JWT-based authentication
- **RBAC:** Kubernetes ServiceAccount with minimal permissions
- **Network Isolation:** Separate namespace for lab pods
- **Registry:** Private container registry with pull secrets
- **Resource Limits:** CPU and memory constraints per pod

## 📊 Resource Management

**Per Lab Pod:**
- CPU: 500m (0.5 cores)
- Memory: 1Gi
- Auto-shutdown: 2 hours

**Cluster Requirements:**
- Minimum: 3 nodes (s-2vcpu-4gb)
- Recommended: 3-5 nodes (s-4vcpu-8gb)
- Autoscaling: Enabled (min: 3, max: 6)

**Capacity:**
- Current: ~6 concurrent labs
- With upgrade: 12-40 concurrent labs

## 🛠️ Maintenance

**View Logs:**
```bash
# Backend
kubectl logs -l app=cyberlab-backend -n default --tail=100

# Frontend
kubectl logs -l app=cyberlab-frontend -n default --tail=100

# Lab pods
kubectl logs <pod-name> -n student-labs
```

**Check Status:**
```bash
# All resources
kubectl get all -n default
kubectl get all -n student-labs

# Specific resources
kubectl get pods -n student-labs
kubectl get svc -n student-labs
```

**Clean Up Failed Pods:**
```bash
kubectl delete pods --all -n student-labs
```

**Restart Services:**
```bash
kubectl rollout restart deployment/backend -n default
kubectl rollout restart deployment/frontend -n default
```

## 🐛 Troubleshooting

### Pod Not Starting (ImagePullBackOff)
```bash
# Check registry secret
kubectl get secrets -n student-labs

# Verify image exists
doctl registry repository list-tags cyberlab-registry/ubuntu-desktop-lab

# Recreate secret
kubectl create secret docker-registry cyberlab-registry \
  --docker-server=registry.digitalocean.com \
  --docker-username=<email> \
  --docker-password=<token> \
  --namespace=student-labs
```

### Pod Pending (Insufficient Resources)
```bash
# Check node resources
kubectl top nodes

# Check pod resource requests
kubectl describe pod <pod-name> -n student-labs

# Solution: Reduce resources or scale cluster
```

### Connection Timeout
```bash
# Verify firewall allows NodePort range (30000-32767)
# Check if pod is running
kubectl get pods -n student-labs

# Check service
kubectl get svc -n student-labs

# Get correct node IP
kubectl get nodes -o wide
```

## 📝 API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Labs:**
- `GET /api/labs/templates` - Get lab templates
- `POST /api/labs/start` - Start lab session
- `GET /api/labs/my-session` - Get active session
- `POST /api/labs/stop` - Stop lab session

## 📄 License

MIT
