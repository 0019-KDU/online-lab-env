# Kubernetes Cluster Monitoring

This directory contains Prometheus and Grafana monitoring setup for the CyberLab Kubernetes cluster.

## 🎯 Components

### Prometheus
- **Purpose**: Metrics collection and storage
- **Version**: v2.48.0
- **Retention**: 15 days
- **Resources**: 500m CPU, 512Mi RAM (request), 1 CPU, 2Gi RAM (limit)

### Grafana
- **Purpose**: Metrics visualization and dashboards
- **Version**: 10.2.0
- **Default Credentials**: `admin` / `admin123` ⚠️ **Change this password!**
- **Resources**: 250m CPU, 256Mi RAM (request), 500m CPU, 512Mi RAM (limit)

## 🌐 Access URLs

### Grafana Dashboard
- **URL**: http://monitoring.152-42-156-112.nip.io
- **Username**: `admin`
- **Password**: `admin123`
- **NodePort**: http://152.42.156.112:30300

### Prometheus UI
- **URL**: http://prometheus.152-42-156-112.nip.io
- **Direct Access**: Query metrics, view targets, check alerts

## 📊 What's Being Monitored

Prometheus is configured to scrape metrics from:

1. **Kubernetes API Server** - Cluster health and performance
2. **Kubernetes Nodes** - CPU, memory, disk, network per node
3. **Kubernetes Pods** - Container metrics, resource usage
4. **cAdvisor** - Detailed container resource metrics
5. **Services** - Service endpoint health checks
6. **Prometheus itself** - Monitor the monitoring system

## 🚀 Quick Start

### 1. Access Grafana
```bash
# Open in browser
http://monitoring.152-42-156-112.nip.io

# Login with default credentials
Username: admin
Password: admin123
```

### 2. Change Default Password
1. Go to Configuration → Preferences → Change Password
2. Set a strong password

### 3. Import Pre-built Dashboards

Grafana has thousands of pre-built dashboards. Import these popular Kubernetes dashboards:

#### Kubernetes Cluster Monitoring Dashboard
1. Go to Dashboards → Import
2. Enter Dashboard ID: **3119**
3. Select "Prometheus" as data source
4. Click Import

#### Node Exporter Full Dashboard
1. Go to Dashboards → Import
2. Enter Dashboard ID: **1860**
3. Select "Prometheus" as data source
4. Click Import

#### Kubernetes Pods Dashboard
1. Go to Dashboards → Import
2. Enter Dashboard ID: **6417**
3. Select "Prometheus" as data source
4. Click Import

#### Kubernetes Deployment Metrics
1. Go to Dashboards → Import
2. Enter Dashboard ID: **8588**
3. Select "Prometheus" as data source
4. Click Import

## 📈 Key Metrics to Monitor

### Cluster Health
- Node CPU usage
- Node memory usage
- Pod restart count
- Failed pods
- Pending pods

### Application Performance
- Backend API response times
- Frontend response times
- Lab session creation rate
- Active lab sessions
- Database connection pool

### Resource Usage
- CPU utilization per namespace
- Memory utilization per namespace
- Disk usage per node
- Network I/O

## 🔧 Configuration Files

- `namespace.yaml` - Monitoring namespace
- `prometheus-config.yaml` - Prometheus scrape configuration
- `prometheus-deployment.yaml` - Prometheus deployment and RBAC
- `grafana-config.yaml` - Grafana datasource and dashboard provisioning
- `grafana-deployment.yaml` - Grafana deployment
- `ingress.yaml` - Ingress rules for external access

## 📝 Useful Prometheus Queries

### Cluster Queries
```promql
# Total number of nodes
count(kube_node_info)

# Total number of pods
count(kube_pod_info)

# CPU usage by namespace
sum(rate(container_cpu_usage_seconds_total[5m])) by (namespace)

# Memory usage by namespace
sum(container_memory_usage_bytes) by (namespace)

# Pod restart count in last hour
increase(kube_pod_container_status_restarts_total[1h]) > 0
```

### Application Queries
```promql
# Number of running lab pods
count(kube_pod_info{namespace="student-labs", pod=~"lab-.*"})

# Backend pod CPU usage
rate(container_cpu_usage_seconds_total{namespace="default", pod=~"backend-.*"}[5m])

# Backend pod memory usage
container_memory_usage_bytes{namespace="default", pod=~"backend-.*"}
```

## 🔒 Security Recommendations

1. **Change Default Password** - Change Grafana admin password immediately
2. **Restrict Access** - Consider adding authentication to ingress
3. **Use HTTPS** - Configure SSL/TLS certificates (when rate limit resets)
4. **Limit Retention** - Adjust retention period based on disk space
5. **Add Alerting** - Configure Alertmanager for critical alerts

## 🛠️ Maintenance Commands

### Check Status
```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
kubectl logs -n monitoring prometheus-<pod-id>
kubectl logs -n monitoring grafana-<pod-id>
```

### Restart Components
```bash
kubectl rollout restart deployment/prometheus -n monitoring
kubectl rollout restart deployment/grafana -n monitoring
```

### Update Configuration
```bash
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
kubectl rollout restart deployment/prometheus -n monitoring
```

### Delete Monitoring Stack
```bash
kubectl delete -f kubernetes/monitoring/
kubectl delete namespace monitoring
```

## 📊 Storage Considerations

- **Current Setup**: Using emptyDir (ephemeral storage)
- **Data Loss**: Metrics are lost when pods restart
- **Production**: Consider using PersistentVolumes for Prometheus data

### Add Persistent Storage (Optional)
```yaml
# Replace emptyDir with PVC in prometheus-deployment.yaml
volumes:
- name: prometheus-storage
  persistentVolumeClaim:
    claimName: prometheus-pvc
```

## 🎓 Learning Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Grafana Dashboard Library](https://grafana.com/grafana/dashboards/)

## 🚨 Troubleshooting

### Prometheus Not Scraping Targets
```bash
# Check Prometheus logs
kubectl logs -n monitoring deployment/prometheus

# Check service discovery
# Open http://prometheus.152-42-156-112.nip.io/targets
```

### Grafana Can't Connect to Prometheus
```bash
# Check if Prometheus service is accessible
kubectl get svc prometheus -n monitoring

# Test connectivity from Grafana pod
kubectl exec -it -n monitoring deployment/grafana -- wget -O- http://prometheus:9090/api/v1/status/config
```

### High Resource Usage
```bash
# Check current resource usage
kubectl top pods -n monitoring

# Reduce scrape interval in prometheus-config.yaml
# Reduce retention time in prometheus-deployment.yaml
```

## 📞 Support

For issues or questions:
- Check logs: `kubectl logs -n monitoring <pod-name>`
- View events: `kubectl get events -n monitoring --sort-by='.lastTimestamp'`
- Describe resources: `kubectl describe pod -n monitoring <pod-name>`
