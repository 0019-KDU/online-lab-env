@echo off
echo ========================================
echo  CyberLab Backend - Ingress Fix Deploy
echo ========================================
echo.

echo Step 1: Building backend Docker image...
cd backend
docker build -t registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest -f ..\docker\backend\Dockerfile .
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker build failed!
    echo Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo.
echo Step 2: Pushing image to DigitalOcean Container Registry...
docker push registry.digitalocean.com/cyberlab-registry/cyberlab-backend:latest
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker push failed!
    echo Make sure you are authenticated with: doctl registry login
    pause
    exit /b 1
)

echo.
echo Step 3: Restarting backend deployment to pick up new image...
cd ..
kubectl rollout restart deployment/backend -n default
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: kubectl rollout restart failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Waiting for deployment to complete...
kubectl rollout status deployment/backend -n default --timeout=120s

echo.
echo ========================================
echo  ✅ Backend deployed successfully!
echo ========================================
echo.
echo The ingress configuration-snippet issue is now fixed.
echo You can now try starting a lab again.
echo.
pause
