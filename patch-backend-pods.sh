#!/bin/bash
# Quick fix script to patch running backend pods
# This removes the forbidden configuration-snippet annotation

echo "========================================="
echo " Patching Backend Pods - Quick Fix"
echo "========================================="
echo ""

PODS=$(kubectl get pods -n default -l app=cyberlab-backend -o name | cut -d'/' -f2)

for POD in $PODS; do
    echo "Patching pod: $POD"
    
    # Copy the file from pod to local
    kubectl cp default/$POD:/app/src/services/k8sService.js ./k8sService-backup.js
    
    # Remove the configuration-snippet lines using sed
    kubectl exec -n default $POD -- sed -i "/configuration-snippet/,+4d" /app/src/services/k8sService.js
    
    # Also fix the deprecated kubernetes.io/ingress.class annotation
    kubectl exec -n default $POD -- sed -i "s/'kubernetes.io\/ingress.class': 'nginx',//g" /app/src/services/k8sService.js
    
    # Add ingressClassName to spec if not exists
    kubectl exec -n default $POD -- sed -i "s/spec: {/spec: {\n          ingressClassName: 'nginx',/g" /app/src/services/k8sService.js
    
    echo "✅ Pod $POD patched"
    echo ""
done

echo "========================================="
echo " ✅ All pods patched!"
echo "========================================="
echo ""
echo "Note: This is a temporary fix. The pods will revert"
echo "to old code if they restart. You need to rebuild"
echo "and push the image for a permanent fix."
echo ""
echo "Try starting a lab now!"
