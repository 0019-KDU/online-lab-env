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

## 🔄 Technical Workflow

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
