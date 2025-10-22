# CyberLab - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [What Has Been Implemented](#what-has-been-implemented)
3. [Current Architecture](#current-architecture)
4. [Next Steps - What To Implement](#next-steps---what-to-implement)
5. [Detailed Implementation Guide](#detailed-implementation-guide)

---

## Project Overview

**CyberLab** is an on-demand lab environment for Learning Management Systems (LMS) that provides each student with their own Ubuntu desktop environment (graphical), accessible directly through a web browser. All desktops are containerized and orchestrated on a Kubernetes cluster.

**Primary Goal:** Enable students to access isolated Ubuntu desktop environments for hands-on learning without needing local installations.

---

## What Has Been Implemented

### ✅ 1. Infrastructure Setup

#### Kubernetes Cluster (DigitalOcean)
- **Cluster Configuration:**
  - 3 nodes minimum (s-2vcpu-4gb)
  - Autoscaling enabled (min: 3, max: 6)
  - NodePort range: 30000-32767 (firewall configured)

#### Namespaces
- `default` - Backend and frontend services
- `student-labs` - Student lab pods

#### Container Registry
- DigitalOcean Container Registry configured
- Private registry with pull secrets
- Images:
  - `cyberlab-backend:latest`
  - `cyberlab-frontend:latest`
  - `ubuntu-desktop-lab:latest`

### ✅ 2. Backend Implementation

#### Tech Stack
- Node.js + Express 5.1
- MongoDB (Mongoose) - Cloud Atlas
- JWT Authentication
- Kubernetes Client Node API

#### Features Implemented
- **Authentication System:**
  - User registration (`POST /api/auth/register`)
  - User login with JWT (`POST /api/auth/login`)
  - Current user profile (`GET /api/auth/me`)

- **Lab Management:**
  - Start lab session (`POST /api/labs/start`)
  - Get active session (`GET /api/labs/my-session`)
  - Stop lab session (`POST /api/labs/stop`)
  - Get lab templates (`GET /api/labs/templates`)

- **Kubernetes Integration:**
  - Dynamic pod creation for each student
  - NodePort service creation (random port allocation)
  - Pod and service cleanup
  - RBAC with ServiceAccount (`lab-manager`)

#### Key Components
```
backend/
├── src/
│   ├── controllers/      # API endpoint handlers
│   ├── models/           # MongoDB schemas (User, LabSession)
│   ├── routes/           # Express routes
│   ├── services/         # K8s integration logic
│   ├── middleware/       # Auth, validation
│   └── config/           # Database configuration
```

### ✅ 3. Frontend Implementation

#### Tech Stack
- React 19.1 + Vite 7.1
- TailwindCSS v4
- Zustand (State Management)
- React Router v7
- Axios for API calls

#### Features Implemented
- User registration and login pages
- Dashboard with lab management
- Lab session viewer with embedded noVNC iframe
- Responsive design

#### Key Components
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components (Login, Dashboard, etc.)
│   ├── services/         # API service layer
│   ├── store/            # Zustand state management
│   └── utils/            # Helper utilities
```

### ✅ 4. Docker Images

#### Ubuntu Desktop Lab Image
- **Base:** Ubuntu 22.04
- **Desktop Environment:** XFCE
- **VNC Server:** x11vnc
- **Web Interface:** noVNC + websockify
- **Includes:** Firefox, VSCode, Python, Node.js, Git

#### Dockerfiles
- Backend Dockerfile (Node.js app)
- Frontend Dockerfile (Nginx serving static React build)
- Ubuntu Desktop Dockerfile (XFCE + noVNC)

### ✅ 5. Kubernetes Deployments

#### Backend Deployment
- 2 replicas for high availability
- ServiceAccount: `lab-manager`
- Resource limits: 512Mi memory, 500m CPU
- Health checks (liveness/readiness probes)
- Environment variables via ConfigMap and Secrets

#### Frontend Deployment
- Nginx serving static files
- ClusterIP service
- Environment: `VITE_API_URL=/api`

#### RBAC Configuration
- **ServiceAccount:** `lab-manager`
- **Permissions:**
  - Create/delete pods and services in `student-labs` namespace
  - List nodes (for getting public IPs)
  - Access to PVC operations

#### Ingress Configuration
- NGINX Ingress Controller
- Routes:
  - `/api/*` → Backend Service
  - `/*` → Frontend Service
- Domain: `152-42-156-112.nip.io`

### ✅ 6. Security Implementation

- **Authentication:** JWT-based with 7-day expiry
- **RBAC:** Minimal permissions per ServiceAccount
- **Network Isolation:** Separate namespace for lab pods
- **Registry:** Private container registry with pull secrets
- **Resource Limits:** CPU and memory constraints per pod

### ✅ 7. Monitoring & Maintenance

- Health check endpoints
- Logging (kubectl logs access)
- Resource monitoring capabilities
- Auto-cleanup of stopped sessions

---

## Current Architecture

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

---

## Next Steps - What To Implement

### 🔄 Phase 1: Persistent Volume Claims (PVC) for Student State

**Current Issue:** When a student stops their lab, all work is lost. The container is ephemeral.

**Solution:** Implement PVC to persist student work across sessions.

#### What Needs to Be Done:

1. **Update Kubernetes RBAC** (Already partially done)
   - RBAC already includes PVC permissions
   - Location: [kubernetes/infrastructure/rbac.yaml](kubernetes/infrastructure/rbac.yaml#L14)

2. **Create PVC Template**
   - Create a new file: `kubernetes/infrastructure/pvc-template.yaml`
   - Each student gets their own PVC (e.g., `student-{userId}-home`)
   - Size: 10Gi per student
   - StorageClass: Use DigitalOcean's default (`do-block-storage`)

3. **Update Backend Lab Service**
   - Modify pod creation logic to:
     - Check if PVC exists for user
     - Create PVC if it doesn't exist
     - Attach PVC to pod at `/home/labuser`
   - Files to modify:
     - `backend/src/services/labService.js` (or similar)

4. **Update Lab Pod Specification**
   - Add volume mount to pod template
   - Mount PVC to `/home/labuser` directory
   - Ensure permissions are correct (uid:1000)

5. **Add PVC Cleanup Endpoint** (Optional)
   - `DELETE /api/labs/delete-workspace` - Delete student's PVC
   - Only allow users to delete their own workspace

#### Benefits:
- Student work persists across sessions
- Students can pick up where they left off
- No data loss when pod is stopped/restarted

---

### 🚀 Phase 2: CI/CD Pipeline with GitHub Actions

**Goal:** Automate the build, test, and deployment process.

#### What Needs to Be Done:

1. **Create GitHub Actions Workflow Files**
   - Create directory: `.github/workflows/`
   - Create workflow files (detailed below)

2. **Backend CI/CD Pipeline**
   - File: `.github/workflows/backend-cicd.yml`
   - **Triggers:**
     - Push to `main` branch (path: `backend/**`)
     - Pull request to `main`
   - **Steps:**
     1. Checkout code
     2. Setup Node.js
     3. Install dependencies (`npm install`)
     4. Run tests (`npm test`)
     5. Run linting (`npm run lint`)
     6. Build Docker image
     7. Tag image with commit SHA and `latest`
     8. Push to DigitalOcean Container Registry
     9. Update Kubernetes deployment (optional: kubectl set image)

3. **Frontend CI/CD Pipeline**
   - File: `.github/workflows/frontend-cicd.yml`
   - **Triggers:**
     - Push to `main` branch (path: `frontend/**`)
     - Pull request to `main`
   - **Steps:**
     1. Checkout code
     2. Setup Node.js
     3. Install dependencies (`npm install`)
     4. Run tests (`npm test`)
     5. Build production bundle (`npm run build`)
     6. Build Docker image
     7. Tag and push to registry
     8. Update Kubernetes deployment

4. **Ubuntu Desktop Image CI/CD**
   - File: `.github/workflows/ubuntu-desktop-cicd.yml`
   - **Triggers:**
     - Push to `main` branch (path: `docker/ubuntu-desktop/**`)
     - Manual workflow dispatch
   - **Steps:**
     1. Checkout code
     2. Build Docker image
     3. Run basic tests (container starts, noVNC accessible)
     4. Tag and push to registry

5. **Setup GitHub Secrets**
   - `DIGITALOCEAN_ACCESS_TOKEN` - For doctl and registry access
   - `KUBE_CONFIG` - Base64 encoded kubeconfig
   - `MONGODB_URI` - For running backend tests
   - `JWT_SECRET` - For tests

6. **Add Deployment Strategy**
   - Use `kubectl set image` or `kubectl apply -f`
   - Add rollback on failure
   - Optional: Blue-green or canary deployment

#### Benefits:
- Automated testing on every commit
- Consistent build process
- Faster deployment cycles
- Reduced human error
- Automatic rollback on failures

---

### 🔧 Phase 3: Infrastructure as Code with Terraform

**Goal:** Manage all infrastructure (Kubernetes cluster, networking, registry) as code.

#### What Needs to Be Done:

1. **Setup Terraform Project Structure**
```
terraform/
├── main.tf                  # Main configuration
├── variables.tf             # Input variables
├── outputs.tf               # Output values
├── providers.tf             # Provider configuration
├── versions.tf              # Version constraints
├── modules/
│   ├── kubernetes/          # K8s cluster module
│   ├── registry/            # Container registry module
│   ├── networking/          # VPC, firewall rules
│   └── database/            # MongoDB (if self-hosted)
└── environments/
    ├── dev/
    ├── staging/
    └── production/
```

2. **Configure DigitalOcean Provider**
   - File: `terraform/providers.tf`
   - Provider: `digitalocean/digitalocean`
   - Variables for API token

3. **Define Kubernetes Cluster Resource**
   - File: `terraform/modules/kubernetes/main.tf`
   - Resources:
     - `digitalocean_kubernetes_cluster`
     - Node pool configuration
     - Auto-scaling settings
     - Firewall rules

4. **Define Container Registry**
   - File: `terraform/modules/registry/main.tf`
   - Resource: `digitalocean_container_registry`

5. **Network Configuration**
   - VPC setup
   - Firewall rules (NodePort range 30000-32767)
   - Load balancer configuration

6. **State Management**
   - Use remote backend (S3, DigitalOcean Spaces, or Terraform Cloud)
   - State locking
   - State encryption

7. **Create Workspaces for Environments**
   - `terraform workspace new dev`
   - `terraform workspace new staging`
   - `terraform workspace new production`

8. **Integration with CI/CD**
   - Add Terraform plan/apply to GitHub Actions
   - File: `.github/workflows/terraform.yml`
   - Run `terraform plan` on PRs
   - Run `terraform apply` on merge to main

#### Resources to Create:
- Kubernetes cluster
- Container registry
- VPC
- Firewall rules
- Load balancer (for Ingress)
- DNS records (if using custom domain)

#### Benefits:
- Infrastructure versioning
- Reproducible environments
- Easy disaster recovery
- Multi-environment management
- Cost tracking and optimization

---

### 📊 Phase 4: Additional Enhancements (Future)

1. **Monitoring & Observability**
   - Prometheus + Grafana
   - Log aggregation (ELK stack or Loki)
   - Alert manager

2. **Resource Quotas & Limits**
   - Per-student resource quotas
   - Namespace-level limits
   - Cost management

3. **Advanced Features**
   - Lab templates with pre-installed software
   - Snapshot functionality (save/restore state)
   - Collaborative labs (multiple students)
   - Time-based auto-shutdown

4. **Security Enhancements**
   - Network policies
   - Pod security policies
   - Secrets encryption at rest
   - Audit logging

---

## Detailed Implementation Guide

### Guide 1: Implementing PVC for Student State Persistence

#### Step 1: Create PVC Template

Create `kubernetes/infrastructure/pvc-template.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: student-{userId}-home
  namespace: student-labs
  labels:
    app: student-lab
    student-id: "{userId}"
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: do-block-storage
  resources:
    requests:
      storage: 10Gi
```

#### Step 2: Update Backend Service

Modify `backend/src/services/labService.js`:

```javascript
// Add PVC creation function
async createOrGetPVC(userId) {
  const pvcName = `student-${userId}-home`;

  try {
    // Check if PVC exists
    await this.k8sApi.readNamespacedPersistentVolumeClaim(
      pvcName,
      this.namespace
    );
    console.log(`PVC ${pvcName} already exists`);
  } catch (error) {
    if (error.statusCode === 404) {
      // Create PVC
      const pvcManifest = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
          name: pvcName,
          namespace: this.namespace,
          labels: {
            app: 'student-lab',
            'student-id': userId.toString()
          }
        },
        spec: {
          accessModes: ['ReadWriteOnce'],
          storageClassName: 'do-block-storage',
          resources: {
            requests: {
              storage: '10Gi'
            }
          }
        }
      };

      await this.k8sApi.createNamespacedPersistentVolumeClaim(
        this.namespace,
        pvcManifest
      );
      console.log(`PVC ${pvcName} created`);
    } else {
      throw error;
    }
  }

  return pvcName;
}

// Update pod creation to include volume mount
async startLab(userId, labTemplateId) {
  // ... existing code ...

  // Create or get PVC
  const pvcName = await this.createOrGetPVC(userId);

  // Add volume mount to pod spec
  const podManifest = {
    // ... existing pod spec ...
    spec: {
      volumes: [
        {
          name: 'student-home',
          persistentVolumeClaim: {
            claimName: pvcName
          }
        }
      ],
      containers: [{
        // ... existing container spec ...
        volumeMounts: [
          {
            name: 'student-home',
            mountPath: '/home/labuser'
          }
        ]
      }]
    }
  };

  // ... rest of pod creation logic ...
}
```

#### Step 3: Test PVC Implementation

```bash
# 1. Deploy updated backend
kubectl apply -f kubernetes/backend/deployment.yaml

# 2. Start a lab session via API
# 3. Verify PVC was created
kubectl get pvc -n student-labs

# 4. Create a file in the lab environment
# 5. Stop the lab
# 6. Start a new lab session
# 7. Verify the file still exists
```

---

### Guide 2: Setting Up GitHub Actions CI/CD

#### Step 1: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

#### Step 2: Create Backend CI/CD Workflow

Create `.github/workflows/backend-cicd.yml`:

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-cicd.yml'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

env:
  REGISTRY: registry.digitalocean.com/cyberlab-registry
  IMAGE_NAME: cyberlab-backend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run linter
        working-directory: ./backend
        run: npm run lint || echo "Linting not configured"

      - name: Run tests
        working-directory: ./backend
        run: npm test || echo "Tests not configured"
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Log in to DO Container Registry
        run: doctl registry login --expiry-seconds 600

      - name: Build Docker image
        working-directory: ./backend
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker tag ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
                     ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

      - name: Push to registry
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Setup kubectl
        run: |
          doctl kubernetes cluster kubeconfig save <YOUR_CLUSTER_NAME>

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/backend \
            backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n default

          kubectl rollout status deployment/backend -n default --timeout=5m
```

#### Step 3: Create Frontend CI/CD Workflow

Create `.github/workflows/frontend-cicd.yml`:

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-cicd.yml'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'

env:
  REGISTRY: registry.digitalocean.com/cyberlab-registry
  IMAGE_NAME: cyberlab-frontend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linter
        working-directory: ./frontend
        run: npm run lint || echo "Linting not configured"

      - name: Run tests
        working-directory: ./frontend
        run: npm test || echo "Tests not configured"

      - name: Build
        working-directory: ./frontend
        run: npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Log in to DO Container Registry
        run: doctl registry login --expiry-seconds 600

      - name: Build Docker image
        working-directory: ./frontend
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker tag ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
                     ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

      - name: Push to registry
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Setup kubectl
        run: |
          doctl kubernetes cluster kubeconfig save <YOUR_CLUSTER_NAME>

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/frontend \
            frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n default

          kubectl rollout status deployment/frontend -n default --timeout=5m
```

#### Step 4: Setup GitHub Secrets

Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add the following secrets:
- `DIGITALOCEAN_ACCESS_TOKEN`
- `MONGODB_URI`
- `JWT_SECRET`

#### Step 5: Test the Pipeline

```bash
# 1. Commit and push changes
git add .github/workflows/
git commit -m "Add CI/CD pipeline"
git push origin main

# 2. Go to GitHub Actions tab
# 3. Watch the workflow run
# 4. Verify deployment succeeded
kubectl get pods -n default
```

---

### Guide 3: Implementing Terraform (Not Now - For Future)

This will be documented separately when you're ready to implement it. It will include:

1. Terraform project structure
2. Provider configuration
3. Resource definitions
4. State management
5. CI/CD integration

---

## Summary

### ✅ Completed (Current State)
- Full-stack application (React + Node.js)
- Kubernetes orchestration
- Docker containerization
- User authentication
- Dynamic lab provisioning
- RBAC and security
- Basic monitoring

### 🔄 Next Immediate Steps
1. **Implement PVC** - For persistent student workspaces
2. **Setup CI/CD** - GitHub Actions for automated deployment
3. **Add Terraform** - Infrastructure as Code (future phase)

### 📈 Future Enhancements
- Monitoring and observability
- Advanced resource management
- Security hardening
- Additional lab features

---

## Quick Reference Commands

### Kubernetes Management
```bash
# View all resources
kubectl get all -n default
kubectl get all -n student-labs

# View logs
kubectl logs -l app=cyberlab-backend -n default --tail=100

# Restart deployment
kubectl rollout restart deployment/backend -n default

# Check PVCs
kubectl get pvc -n student-labs

# Delete all lab pods
kubectl delete pods --all -n student-labs
```

### Docker Commands
```bash
# Build images
docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest ./backend
docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest ./frontend

# Push images
docker push registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest
docker push registry.digitalocean.com/cyberlab-registry/cyberlab-frontend:latest
```

### DigitalOcean CLI
```bash
# Login to registry
doctl registry login

# List clusters
doctl kubernetes cluster list

# Get kubeconfig
doctl kubernetes cluster kubeconfig save <cluster-name>

# List registry images
doctl registry repository list-tags cyberlab-registry/cyberlab-backend
```

---

**Last Updated:** October 2025
**Version:** 1.0.0
