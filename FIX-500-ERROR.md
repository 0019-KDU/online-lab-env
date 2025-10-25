# URGENT FIX: Lab Start Failing with 500 Error

## Problem
When clicking "Start Lab", you get:
```
POST http://152-42-156-112.nip.io/api/labs/start 500 (Internal Server Error)
Failed to start lab: AxiosError: Request failed with status code 500
```

## Root Cause
Backend logs show:
```
Error creating ingress: admission webhook "validate.nginx.ingress.kubernetes.io" 
denied the request: nginx.ingress.kubernetes.io/configuration-snippet annotation 
cannot be used. Snippet directives are disabled by the Ingress administrator
```

**The NGINX Ingress Controller has snippet directives DISABLED for security reasons.**

The recent fix I added included a `configuration-snippet` annotation which is now blocked.

## Solution Applied

### 1. Removed Forbidden Annotation ✅

**File:** `backend/src/services/k8sService.js`

**REMOVED:**
```javascript
'nginx.ingress.kubernetes.io/configuration-snippet': `
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_cache_bypass $http_upgrade;
`
```

**Why:** These headers are actually set automatically by NGINX when using the `proxy-http-version: 1.1` annotation with WebSocket services.

### 2. Fixed Deprecated Annotation ✅

**CHANGED FROM:**
```javascript
annotations: {
  'kubernetes.io/ingress.class': 'nginx',  // ❌ DEPRECATED
  ...
}
```

**TO:**
```javascript
spec: {
  ingressClassName: 'nginx',  // ✅ CORRECT
  ...
}
```

**Why:** The warning said: `annotation "kubernetes.io/ingress.class" is deprecated, please use 'spec.ingressClassName' instead`

### 3. Kept Essential WebSocket Annotations ✅

These annotations are ALLOWED and necessary:
```javascript
'nginx.ingress.kubernetes.io/websocket-services': serviceName,
'nginx.ingress.kubernetes.io/proxy-http-version': '1.1',
'nginx.ingress.kubernetes.io/proxy-read-timeout': '3600',
'nginx.ingress.kubernetes.io/proxy-send-timeout': '3600',
'nginx.ingress.kubernetes.io/proxy-connect-timeout': '300',
'nginx.ingress.kubernetes.io/proxy-buffering': 'off',
'nginx.ingress.kubernetes.io/proxy-request-buffering': 'off',
```

## How to Deploy the Fix

### Option 1: Automated Script (When Docker is Running)

1. **Start Docker Desktop**
2. **Run the deployment script:**
   ```cmd
   deploy-backend-fix.bat
   ```

This will:
- Build new backend image with the fix
- Push to DigitalOcean Container Registry
- Restart backend deployment
- Wait for rollout to complete

### Option 2: Manual Steps

If Docker is not available or you prefer manual control:

```bash
# Step 1: Build backend image (when Docker is running)
cd backend
docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest -f ../docker/backend/Dockerfile .

# Step 2: Push to registry
docker push registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest

# Step 3: Restart backend deployment
kubectl rollout restart deployment/backend -n default

# Step 4: Wait for rollout
kubectl rollout status deployment/backend -n default

# Step 5: Verify pods are running
kubectl get pods -n default | findstr backend
```

### Option 3: Quick Test (Temporary)

If you want to test immediately without rebuilding:

1. Delete one of the failed lab pods:
   ```bash
   kubectl delete pod lab-68fd1ad60af09b0a74d6ae4c-1761418008423 -n student-labs
   ```

2. **Start Docker Desktop first**, then run the deployment script

## Verification

After deploying the fix:

1. **Check backend logs:**
   ```bash
   kubectl logs deployment/backend -n default --tail=20 -f
   ```

2. **Try starting a lab:**
   - Go to CyberLab frontend
   - Click "Start Your Lab"
   - Should see: "Preparing lab... (30-60s)"
   - After 30-60 seconds: "✅ Lab is ready!"
   - Desktop should load without 503/403 errors

3. **Verify ingress was created:**
   ```bash
   kubectl get ingress -n student-labs
   ```

4. **Check for errors:**
   - Should NOT see "configuration-snippet" error
   - Should NOT see "kubernetes.io/ingress.class" deprecation warning

## Why This Happened

The previous fix to solve 503/403 errors added a `configuration-snippet` annotation to improve WebSocket handling. However:

1. **Security Policy:** Many Kubernetes administrators disable snippet directives because they allow arbitrary NGINX configuration, which can be a security risk.

2. **Not Actually Needed:** The standard annotations (`proxy-http-version: 1.1` + `websocket-services`) are sufficient for WebSocket support.

3. **Better Approach:** Use only the allowed, standard NGINX Ingress annotations.

## Current Status

✅ **Code fixed** - configuration-snippet removed from k8sService.js
✅ **Deprecated annotation fixed** - using spec.ingressClassName
✅ **Deployment script created** - deploy-backend-fix.bat
⏳ **Pending:** Deploy to cluster (requires Docker Desktop running)

## Next Steps

1. **Start Docker Desktop**
2. **Run:** `deploy-backend-fix.bat`
3. **Test:** Start a new lab
4. **Cleanup:** Delete old failed pods if needed

---

## Additional Notes

- Old working labs will continue to work (they use old ingresses)
- Only NEW lab starts were failing
- This fix maintains all the readiness probe improvements from the previous fix
- WebSocket functionality is preserved through standard annotations
