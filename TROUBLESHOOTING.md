# CyberLab Troubleshooting Guide

Common issues and solutions for the CyberLab platform.

---

## Lab Desktop Loading Issues (503/403 Errors)

### Symptoms
- Ubuntu desktop shows 503 Service Unavailable error
- Ubuntu desktop shows 403 Forbidden error
- Need to refresh page multiple times to access desktop
- Desktop takes long time to load

### Root Causes
1. **Pod not fully ready** - Pod marked as "Running" but services inside not started yet
2. **Ingress connecting too early** - NGINX tries to connect before websockify is ready
3. **No health checks** - System doesn't verify desktop is accessible before returning URL

### Solutions Implemented

#### 1. Added Health Probes to Pod (FIXED)

Added three types of probes to ensure desktop is fully ready:

```yaml
# Startup Probe - Gives 60 seconds for initial startup
startupProbe:
  httpGet:
    path: /vnc.html
    port: 6080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 12  # 12 × 5s = 60s max startup time

# Readiness Probe - Checks if pod can accept traffic
readinessProbe:
  httpGet:
    path: /vnc.html
    port: 6080
  initialDelaySeconds: 15
  periodSeconds: 5
  
# Liveness Probe - Ensures pod is still healthy
livenessProbe:
  httpGet:
    path: /vnc.html
    port: 6080
  initialDelaySeconds: 30
  periodSeconds: 10
```

**What this fixes:**
- Pod won't be marked "Ready" until noVNC is actually accessible
- Kubernetes won't route traffic until probes pass
- Automatic restart if desktop becomes unresponsive

#### 2. Backend Waits for Pod Ready (FIXED)

Added `waitForPodReady()` function in k8sService:

```javascript
async waitForPodReady(podName, namespace, timeoutSeconds = 90) {
  // Polls pod status every 3 seconds
  // Waits for Ready condition to be True
  // Timeout after 90 seconds
}
```

**What this fixes:**
- Backend doesn't return access URL until pod is actually ready
- User receives URL only when desktop is guaranteed to be accessible
- No more "Service Unavailable" on first access

#### 3. Improved Ingress Configuration (FIXED)

Added better WebSocket and connection handling:

```yaml
annotations:
  nginx.ingress.kubernetes.io/proxy-buffering: 'off'
  nginx.ingress.kubernetes.io/proxy-request-buffering: 'off'
  nginx.ingress.kubernetes.io/proxy-http-version: '1.1'
  nginx.ingress.kubernetes.io/proxy-connect-timeout: '300'
  nginx.ingress.kubernetes.io/configuration-snippet: |
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_cache_bypass $http_upgrade;
```

**What this fixes:**
- Better WebSocket connection stability
- Faster connection establishment
- Prevents buffering issues that cause delays

#### 4. Frontend Loading States (FIXED)

Updated UI to show proper loading messages:

```jsx
// LabCard shows: "Preparing lab... (30-60s)"
// Success message: "✅ Lab is ready! Opening in new tab..."
```

**What this fixes:**
- User knows lab is being prepared
- Clear expectation of wait time
- Better error messages if something fails

---

## How to Verify Fixes

### 1. Check Pod Readiness
```bash
# Watch pod become ready
kubectl get pods -n student-labs -w

# Should see:
# lab-xxx-123   0/1     Pending     0          2s
# lab-xxx-123   0/1     Running     0          5s
# lab-xxx-123   0/1     Running     0          12s   (startup probe running)
# lab-xxx-123   1/1     Running     0          22s   (✅ Ready!)
```

### 2. Check Backend Logs
```bash
kubectl logs deployment/backend -n default --tail=50

# Should see:
# ⏳ Waiting for pod to be ready...
# ⏳ Pod lab-xxx-123 status: Running, waiting for Ready...
# ✅ Pod lab-xxx-123 is ready!
# ✅ Pod is ready and accessible!
```

### 3. Test Lab Access
```bash
# Get lab URL from frontend
# Open in browser - should load immediately without errors
# No 503/403 errors
# Desktop appears within 5 seconds
```

---

## Other Common Issues

### Issue: "Failed to deploy lab environment"

**Cause:** Insufficient cluster resources

**Solution:**
```bash
# Check node resources
kubectl top nodes

# Check if nodes have capacity
kubectl describe nodes | grep -A 5 "Allocated resources"

# Scale cluster if needed (DigitalOcean)
doctl kubernetes cluster node-pool update <cluster-id> <pool-id> --count 6
```

---

### Issue: "PVC stuck in Pending"

**Cause:** Storage provisioner not working

**Solution:**
```bash
# Check PVC status
kubectl get pvc -n student-labs

# Check events
kubectl describe pvc <pvc-name> -n student-labs

# Verify storage class exists
kubectl get storageclass

# If using DigitalOcean, check CSI driver
kubectl get pods -n kube-system | grep csi
```

---

### Issue: "ImagePullBackOff" error

**Cause:** Cannot pull image from registry

**Solution:**
```bash
# Check image pull secret exists
kubectl get secret cyberlab-registry -n student-labs

# Recreate secret if needed
kubectl create secret docker-registry cyberlab-registry \
  --docker-server=registry.digitalocean.com \
  --docker-username=<token> \
  --docker-password=<token> \
  -n student-labs

# Verify image exists in registry
doctl registry repository list-tags ubuntu-desktop-lab
```

---

### Issue: "Ingress not routing traffic"

**Cause:** Ingress controller not configured properly

**Solution:**
```bash
# Check ingress controller is running
kubectl get pods -n ingress-nginx

# Check ingress created
kubectl get ingress -n student-labs

# Check ingress details
kubectl describe ingress <ingress-name> -n student-labs

# Check LoadBalancer IP
kubectl get svc -n ingress-nginx
```

---

### Issue: Desktop loads but keyboard/mouse don't work

**Cause:** WebSocket connection issue

**Solution:**
1. Check browser console for WebSocket errors
2. Verify ingress WebSocket annotations
3. Try different browser (Chrome/Firefox work best)
4. Check firewall isn't blocking WebSocket

---

## Performance Optimization

### If labs are slow to start:

1. **Pre-pull images on nodes:**
```bash
# SSH to each node and pull image
docker pull registry.digitalocean.com/cyberlab-registry/ubuntu-desktop-lab:latest
```

2. **Increase node resources:**
```bash
# Use larger node size (e.g., s-4vcpu-8gb instead of s-2vcpu-4gb)
```

3. **Reduce image size:**
```dockerfile
# In Dockerfile, remove unnecessary packages
# Use multi-stage builds
# Clean apt cache
```

---

## Monitoring Commands

### Check overall system health:
```bash
# All pods
kubectl get pods -A

# Resource usage
kubectl top nodes
kubectl top pods -n student-labs

# Recent events
kubectl get events -n student-labs --sort-by='.lastTimestamp'
```

### Check specific lab session:
```bash
# Get pod name from database or frontend
POD_NAME="lab-xxx-123"

# Pod status
kubectl get pod $POD_NAME -n student-labs

# Pod logs
kubectl logs $POD_NAME -n student-labs

# Pod events
kubectl describe pod $POD_NAME -n student-labs

# Execute command inside pod
kubectl exec -it $POD_NAME -n student-labs -- /bin/bash
```

---

## Contact Support

If issues persist after trying these solutions:

1. Collect logs:
   ```bash
   kubectl logs deployment/backend -n default > backend.log
   kubectl logs deployment/frontend -n default > frontend.log
   kubectl get events -n student-labs > events.log
   ```

2. Check backend/frontend error messages
3. Provide session ID and timestamp when issue occurred
4. Share any browser console errors

---

## Expected Behavior (After Fixes)

✅ **Starting a lab:**
- Student clicks "Start Lab"
- Button shows "Preparing lab... (30-60s)"
- Backend creates pod and waits for ready status
- After 30-60 seconds, success message appears
- Lab URL opens in new tab
- Desktop loads immediately without errors

✅ **Accessing lab:**
- No 503 errors
- No 403 errors
- No need to refresh page
- Desktop appears within 5 seconds
- Keyboard and mouse work immediately

✅ **Stopping lab:**
- Clean shutdown
- Resources deleted properly
- Student can start new lab
