# 🚀 CyberLab Platform

A cloud-native virtual lab platform for cybersecurity education, providing isolated Ubuntu desktop environments accessible directly from web browsers.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Flow](#system-flow)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Security](#security)
- [Performance](#performance)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

CyberLab is an educational platform that enables students to access full-featured Ubuntu desktop environments through their web browsers. Built on Kubernetes, it provides isolated, ephemeral lab environments perfect for cybersecurity training, coding bootcamps, and technical education.

### Key Capabilities

- **Browser-Based Access**: No client software installation required
- **Dynamic Provisioning**: Labs created on-demand in 30-45 seconds
- **Complete Isolation**: Each student gets their own containerized environment
- **Auto-Scaling**: Handles multiple concurrent users efficiently
- **Resource Management**: Automated shutdown and resource limits

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Student Browser │
│   (React App)   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│ NGINX Ingress   │
│   Controller    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Backend API    │────▶│  MongoDB Atlas   │
│  (Express.js)   │     │  (Database)      │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│   Kubernetes    │
│     Cluster     │
│  ┌───────────┐  │
│  │   Pod 1   │  │
│  │ (Student) │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │   Pod 2   │  │
│  │ (Student) │  │
│  └───────────┘  │
└─────────────────┘
```

### Component Breakdown

1. **Frontend (React)**
   - Student portal interface
   - Lab session management
   - noVNC iframe integration

2. **Backend (Node.js/Express)**
   - JWT authentication
   - RESTful API endpoints
   - Kubernetes orchestration
   - Session management

3. **Database (MongoDB Atlas)**
   - User profiles
   - Lab sessions
   - Activity logs

4. **Kubernetes Cluster**
   - Pod orchestration
   - Network isolation
   - Resource management
   - Auto-scaling

5. **Container Registry (DigitalOcean)**
   - Ubuntu desktop images
   - Version control
   - Fast image pulls

## ✨ Features

### For Students

- ✅ **One-Click Lab Access**: Start a full Ubuntu desktop in seconds
- ✅ **Pre-Installed Tools**: VSCode, Firefox, terminal, development tools
- ✅ **Resume Sessions**: Return to existing labs without losing progress
- ✅ **Secure Isolation**: Private environment per student
- ✅ **Auto-Save Work**: Session persistence across browser refreshes

### For Instructors

- ✅ **Student Monitoring**: Track active sessions and usage
- ✅ **Resource Quotas**: Limit CPU/memory per student
- ✅ **Auto-Shutdown**: Configurable session timeouts (default: 2 hours)
- ✅ **Scalability**: Handle 100+ concurrent students
- ✅ **Custom Lab Templates**: Deploy specialized environments

### For Administrators

- ✅ **Kubernetes-Native**: Leverages K8s for orchestration
- ✅ **Multi-Tenant**: Namespace isolation between user groups
- ✅ **Audit Logs**: Complete activity tracking
- ✅ **Cost Control**: Resource limits prevent overuse
- ✅ **Easy Deployment**: Helm charts and CI/CD ready

## 🛠️ Technology Stack

### Frontend
- **React 18**: UI framework
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **React Router**: Navigation

### Backend
- **Node.js 18**: Runtime
- **Express.js**: Web framework
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication
- **@kubernetes/client-node**: K8s API client

### Infrastructure
- **Kubernetes 1.28+**: Container orchestration
- **MongoDB Atlas**: Database
- **DigitalOcean Kubernetes**: Managed K8s
- **DigitalOcean Container Registry**: Image storage
- **NGINX Ingress**: Reverse proxy

### Container Stack
- **Ubuntu 22.04**: Base OS
- **XFCE4**: Desktop environment
- **x11vnc**: VNC server
- **noVNC**: WebSocket-to-VNC proxy
- **Xvfb**: Virtual display

## 🔄 System Flow

### Complete End-to-End Process

#### Step 1: Student Authentication
```
Student clicks "Start Lab"
    ↓
Frontend sends POST /api/labs/start
    ↓
JWT token in Authorization header
    ↓
Backend validates token
    ↓
Student profile loaded from MongoDB
```

#### Step 2: Session Check
```
Check for existing running session
    ↓
IF EXISTS: Return existing accessUrl
IF NOT EXISTS: Continue to create new lab
```

#### Step 3: Lab Provisioning
```
Create LabSession record in MongoDB
    ↓
Generate unique pod name: lab-{studentId}-{timestamp}
    ↓
Call k8sService.deployLabPod()
```

#### Step 4: Kubernetes Deployment
```
Build pod manifest with:
    - Image: ubuntu-desktop-lab:latest
    - Resources: 500m CPU, 1Gi RAM
    - Labels: session={uniqueId}
    ↓
Create pod in student-labs namespace
    ↓
Generate random NodePort (30000-32767)
    ↓
Create NodePort service with session selector
```

#### Step 5: Network Routing
```
Service routes traffic to pod via label selector
    ↓
Generate access URL: http://{publicIP}:{nodePort}/vnc.html
    ↓
Update LabSession with accessUrl and status='running'
```

#### Step 6: Student Access
```
Frontend displays iframe with accessUrl
    ↓
Browser connects to NodePort
    ↓
Traffic routed to correct pod via service
    ↓
noVNC establishes WebSocket connection
    ↓
Student sees Ubuntu desktop!
```

### Timing Breakdown

| Step | Duration | What's Happening |
|------|----------|------------------|
| Authentication | 1-2s | JWT validation, DB lookup |
| K8s API Calls | 2-3s | Pod/service creation |
| Container Startup | 25-35s | Image pull, OS boot, VNC start |
| noVNC Connection | 2-3s | WebSocket handshake |
| **Total** | **30-45s** | **Complete lab ready** |

## 📦 Prerequisites

### Required Software

- **Kubernetes Cluster**: v1.28 or higher
- **kubectl**: Configured with cluster access
- **Node.js**: v18.x or higher
- **npm** or **yarn**: Latest stable
- **MongoDB**: Atlas account or self-hosted instance
- **Docker**: For building custom images

### Required Accounts

- **MongoDB Atlas**: Free tier sufficient for testing
- **DigitalOcean** (or equivalent): For K8s and container registry
- **Domain Name** (optional): For production HTTPS

### Cluster Requirements

- **Minimum**: 3 nodes (2 vCPU, 4GB RAM each)
- **Recommended**: 5 nodes (4 vCPU, 8GB RAM each)
- **Storage**: Block storage support for persistent volumes

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/cyberlab-platform.git
cd cyberlab-platform
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cyberlab
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
PUBLIC_NODE_IP=your-cluster-public-ip
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

### 4. Build Docker Images

```bash
# Build backend image
cd backend
docker build -t your-registry/cyberlab-backend:latest .
docker push your-registry/cyberlab-backend:latest

# Build frontend image
cd ../frontend
docker build -t your-registry/cyberlab-frontend:latest .
docker push your-registry/cyberlab-frontend:latest

# Build Ubuntu desktop lab image
cd ../docker/ubuntu-desktop
docker build -t your-registry/ubuntu-desktop-lab:latest .
docker push your-registry/ubuntu-desktop-lab:latest
```

### 5. Kubernetes Deployment

```bash
cd k8s

# Create namespace
kubectl create namespace cyberlab

# Create secrets
kubectl create secret generic cyberlab-secrets \
  --from-literal=mongo-uri="mongodb+srv://..." \
  --from-literal=jwt-secret="your-secret" \
  -n cyberlab

# Create registry secret
kubectl create secret docker-registry cyberlab-registry \
  --docker-server=registry.digitalocean.com \
  --docker-username=your-token \
  --docker-password=your-token \
  -n cyberlab

# Deploy backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# Deploy frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Setup ingress
kubectl apply -f ingress.yaml

# Create student-labs namespace
kubectl create namespace student-labs

# Apply RBAC for lab management
kubectl apply -f rbac.yaml

# Apply resource limits
kubectl apply -f resource-quota.yaml
kubectl apply -f limit-range.yaml
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection | `mongodb+srv://...` |
| `JWT_SECRET` | Token signing key | `random-secret-key` |
| `JWT_EXPIRE` | Token validity | `7d` |
| `PUBLIC_NODE_IP` | Cluster public IP | `139.59.87.226` |

#### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://api.cyberlab.com` |
| `REACT_APP_ENV` | Build environment | `production` |

### Kubernetes Resources

#### Resource Limits (per pod)

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

#### Namespace Quota

```yaml
hard:
  pods: "100"                    # Max 100 concurrent labs
  requests.cpu: "50"             # 50 CPU cores total
  requests.memory: "100Gi"       # 100GB RAM total
```

### Lab Configuration

Edit `backend/controllers/labController.js`:

```javascript
const defaultLabConfig = {
  name: 'Ubuntu Desktop Lab',
  image: 'your-registry/ubuntu-desktop-lab:latest',
  resources: {
    cpu: '500m',      // Adjust CPU
    memory: '1Gi'     // Adjust RAM
  },
  duration: 120       // Auto-shutdown in minutes
};
```

## 📖 Usage

### For Students

1. **Register/Login**
   ```
   Navigate to https://cyberlab.yourdomain.com
   Create account or login
   ```

2. **Start Lab**
   ```
   Click "Start Lab" button
   Wait 30-45 seconds for provisioning
   Desktop appears in browser window
   ```

3. **Work in Lab**
   ```
   Open terminal: Ctrl+Alt+T
   Install packages: sudo apt install <package>
   Write code: Launch VSCode
   Browse web: Open Firefox
   ```

4. **Save Work** (if persistence enabled)
   ```
   All files in /home/student are auto-saved
   Simply close browser when done
   Return later - work is preserved
   ```

### For Instructors

1. **Monitor Active Labs**
   ```bash
   kubectl get pods -n student-labs
   kubectl get svc -n student-labs
   ```

2. **View Student Activity**
   ```
   Access admin dashboard
   View active sessions, resources
   Check logs for troubleshooting
   ```

3. **Force Shutdown Lab**
   ```bash
   kubectl delete pod <pod-name> -n student-labs
   ```

### For Administrators

1. **Scale Backend**
   ```bash
   kubectl scale deployment cyberlab-backend --replicas=5 -n cyberlab
   ```

2. **Update Lab Image**
   ```bash
   # Build new image
   docker build -t registry/ubuntu-desktop-lab:v2 .
   docker push registry/ubuntu-desktop-lab:v2
   
   # Update config
   Edit defaultLabConfig.image
   
   # Restart backend
   kubectl rollout restart deployment cyberlab-backend -n cyberlab
   ```

3. **Check Cluster Health**
   ```bash
   kubectl top nodes
   kubectl top pods -n student-labs
   kubectl get events -n student-labs --sort-by='.lastTimestamp'
   ```

## 🔒 Security

### Authentication & Authorization

- **JWT Tokens**: 7-day expiry, signed with secret key
- **Password Hashing**: bcrypt with 10 salt rounds
- **RBAC**: Kubernetes ServiceAccount with limited permissions
- **HTTPS Only**: TLS 1.3 enforced via Ingress

### Network Isolation

```javascript
// Each lab gets unique session ID
selector: {
  app: 'student-lab',
  session: labSession._id.toString()  // Prevents crosstalk
}
```

**How it works:**
- Student A: Session `aaa111` → Service routes to Pod with label `session=aaa111`
- Student B: Session `bbb222` → Service routes to Pod with label `session=bbb222`
- Result: Complete traffic isolation even on shared NodePorts

### Resource Protection

1. **LimitRange**: Enforces max CPU/memory per pod
2. **ResourceQuota**: Limits total resources in namespace
3. **NetworkPolicy**: (Optional) Block inter-pod communication
4. **PodSecurityPolicy**: Restricts privileged containers

### Best Practices

- ✅ Rotate JWT secrets monthly
- ✅ Use TLS for all external traffic
- ✅ Enable audit logging in Kubernetes
- ✅ Regularly update container images
- ✅ Monitor for abnormal resource usage

## ⚡ Performance

### Optimization Strategies

1. **Image Pre-Pulling**
   ```yaml
   # DaemonSet to pre-pull images on all nodes
   apiVersion: apps/v1
   kind: DaemonSet
   metadata:
     name: image-prepuller
   spec:
     template:
       spec:
         containers:
         - name: prepuller
           image: your-registry/ubuntu-desktop-lab:latest
           command: ["/bin/sh", "-c", "sleep infinity"]
   ```

2. **Pod Pre-Warming** (Future)
   - Keep 10 "warm" pods ready
   - Assign to students instantly
   - Replenish pool as used

3. **Resource Tuning**
   ```yaml
   # Faster startups with NVMe storage
   storageClass: do-block-storage-nvme
   ```

### Scaling Guidelines

| Users | Nodes | CPU/Node | RAM/Node |
|-------|-------|----------|----------|
| 1-20 | 2 | 2 cores | 4 GB |
| 21-50 | 3 | 4 cores | 8 GB |
| 51-100 | 5 | 4 cores | 8 GB |
| 100+ | 10+ | 8 cores | 16 GB |

### Monitoring

```bash
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View metrics
kubectl top nodes
kubectl top pods -n student-labs
```

## 📚 API Documentation

### Authentication

#### Register Student
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "student": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Lab Management

#### Start Lab
```http
POST /api/labs/start
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "_id": "676c12345abcdef987654321",
  "student": "507f1f77bcf86cd799439011",
  "podName": "lab-507f1f77bcf86cd799439011-1735324800",
  "namespace": "student-labs",
  "status": "running",
  "accessUrl": "http://139.59.87.226:31245/vnc.html?autoconnect=true",
  "vncPort": 31245,
  "startTime": "2024-12-27T10:00:00.000Z",
  "autoShutdownTime": "2024-12-27T12:00:00.000Z"
}
```

#### Get Active Session
```http
GET /api/labs/active
Authorization: Bearer <jwt-token>
```

#### Stop Lab
```http
POST /api/labs/:sessionId/stop
Authorization: Bearer <jwt-token>
```

#### Get Session History
```http
GET /api/labs/history
Authorization: Bearer <jwt-token>
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Lab Won't Start
```bash
# Check pod status
kubectl get pods -n student-labs

# View pod logs
kubectl logs <pod-name> -n student-labs

# Describe pod for events
kubectl describe pod <pod-name> -n student-labs
```

**Common causes:**
- Image pull errors (check registry credentials)
- Insufficient cluster resources
- Network policy blocking traffic

#### 2. Can't Connect to Desktop
```bash
# Check service
kubectl get svc -n student-labs

# Test NodePort locally
curl http://<node-ip>:<nodeport>
```

**Common causes:**
- Firewall blocking NodePort range (30000-32767)
- Service selector not matching pod labels
- Container startup still in progress

#### 3. Desktop Freezes/Slow
```bash
# Check resource usage
kubectl top pod <pod-name> -n student-labs
```

**Solutions:**
- Increase CPU/memory limits
- Check cluster node resources
- Reduce concurrent labs

#### 4. Authentication Failed
```bash
# Check backend logs
kubectl logs -l app=cyberlab-backend -n cyberlab

# Verify MongoDB connection
# Check JWT_SECRET in secrets
```

### Debug Mode

Enable verbose logging:
```bash
# Backend
kubectl set env deployment/cyberlab-backend NODE_ENV=development -n cyberlab

# View detailed logs
kubectl logs -f deployment/cyberlab-backend -n cyberlab
```

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Kubernetes health
kubectl get componentstatuses
kubectl cluster-info
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards

- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier + React best practices
- **Commits**: Conventional Commits format
- **Tests**: Jest for unit tests, Cypress for E2E

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kubernetes Community**: For excellent documentation
- **noVNC Project**: For web-based VNC client
- **DigitalOcean**: For managed Kubernetes platform
- **MongoDB**: For reliable database services

## 📧 Support

- **Documentation**: https://docs.cyberlab.com
- **Issues**: https://github.com/yourusername/cyberlab/issues
- **Email**: support@cyberlab.com
- **Discord**: https://discord.gg/cyberlab

## 🗺️ Roadmap

### Q1 2025
- [ ] Persistent storage implementation
- [ ] Snapshot/restore functionality
- [ ] Custom lab templates
- [ ] Instructor dashboard

### Q2 2025
- [ ] Multi-region support
- [ ] Advanced monitoring/analytics
- [ ] Integration with LMS platforms
- [ ] Mobile app (iOS/Android)

### Q3 2025
- [ ] AI-powered lab assistance
- [ ] Collaborative labs (multiple students)
- [ ] Advanced networking scenarios
- [ ] Exam proctoring features

---

**Built with ❤️ by the CyberLab Team**

*Last Updated: December 2024*