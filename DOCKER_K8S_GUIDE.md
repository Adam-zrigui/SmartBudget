# Docker & Kubernetes Deployment Guide

## Overview

SmartBudget is configured for both Docker and Kubernetes deployment:
- **Docker**: For local development and single-server deployments
- **Kubernetes**: For scalable, production-grade cloud deployments

## Quick Start

### Option 1: Docker (Local Development)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Access: http://localhost:3000

### Option 2: Kubernetes (Production)

```bash
# Edit secrets
nano k8s/secret.yaml  # Update with your actual values

# Deploy
./deploy.sh production latest

# Or on Windows:
.\deploy.ps1 -Environment production -ImageTag latest
```

---

## Docker Configuration

### Files
- **Dockerfile**: Multi-stage build (optimized for production)
- **docker-compose.yml**: Local development setup with PostgreSQL and Redis
- **.dockerignore**: Optimizes build size

### Build Image

```bash
# Build locally
docker build -t smartbudget:latest .

# Push to registry
docker tag smartbudget:latest your-registry/smartbudget:latest
docker push your-registry/smartbudget:latest
```

### Run Container

```bash
# With environment file
docker run -d \
  --name smartbudget \
  -p 3000:3000 \
  --env-file .env \
  smartbudget:latest

# Manual environment variables
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXTAUTH_URL=https://smartbudget.example.com \
  -e DATABASE_URL=postgresql://... \
  -e NEXTAUTH_SECRET=your-secret \
  -e GOOGLE_CLIENT_ID=... \
  -e GOOGLE_CLIENT_SECRET=... \
  -e GROQ_API_KEY=... \
  smartbudget:latest
```

### Docker Compose Services

```yaml
Services:
  app       - Next.js application (port 3000)
  postgres  - PostgreSQL database (port 5432)
  redis     - Redis cache (port 6379)
```

---

## Kubernetes Configuration

### Directory Structure

```
k8s/
├── namespace.yaml      # Isolate workload
├── rbac.yaml          # ServiceAccount & permissions
├── deployment.yaml    # 3 replicas with health checks
├── service.yaml       # ClusterIP service
├── ingress.yaml       # NGINX + TLS
├── configmap.yaml     # Non-secret config
├── secret.yaml        # Secrets (update first!)
├── hpa.yaml           # Auto-scaling (3-10 replicas)
├── pdb.yaml           # High availability
└── README.md          # Detailed guide
```

### Prerequisites

```bash
# 1. Kubernetes cluster (1.20+)
# 2. kubectl configured
# 3. Docker registry access
# 4. Ingress controller (nginx-ingress)
# 5. cert-manager (for TLS)

# Install ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/kind/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### Deployment Steps

```bash
# 1. Configure secrets
cat k8s/secret.yaml
# Edit with your actual values

# 2. Configure domain
# Edit k8s/ingress.yaml: change smartbudget.example.com

# 3. Build and push image
docker build -t your-registry/smartbudget:v1 .
docker push your-registry/smartbudget:v1

# 4. Update deployment
sed -i 's|smartbudget:latest|your-registry/smartbudget:v1|g' k8s/deployment.yaml

# 5. Deploy
kubectl apply -f k8s/

# Or use deployment script:
./deploy.sh production v1
```

### Verification

```bash
# Check deployment
kubectl get deployment -n smartbudget

# Check pods
kubectl get pods -n smartbudget

# Check services
kubectl get svc -n smartbudget

# Check ingress
kubectl get ingress -n smartbudget

# View logs
kubectl logs -n smartbudget deployment/smartbudget -f

# Port forward to test
kubectl port-forward -n smartbudget svc/smartbudget-service 3000:80
# Access: http://localhost:3000
```

---

## Environment Variables

### Required
- `NODE_ENV`: development | production
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random string (generate: `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your domain (https://smartbudget.example.com)

### OAuth
- `GOOGLE_CLIENT_ID`: From Google Console
- `GOOGLE_CLIENT_SECRET`: From Google Console

### AI
- `GROQ_API_KEY`: From Groq.com console
- `USE_LOCAL_AI`: true | false

### Optional
- `PORT`: 3000 (default)

---

## Scaling

### Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml smartbudget

# Scale service
docker service scale smartbudget_app=5

# Update image
docker service update \
  --image your-registry/smartbudget:v2 \
  smartbudget_app
```

### Kubernetes Auto-Scaling

The HPA automatically scales based on:
- CPU > 70% → Scale up
- Memory > 80% → Scale up
- Min replicas: 3
- Max replicas: 10

View: `k8s/hpa.yaml`

---

## Production Checklist

### Security
- [ ] Strong NEXTAUTH_SECRET
- [ ] HTTPS enabled
- [ ] Secrets in secure storage (not .env)
- [ ] API key rotation enabled
- [ ] Database backups configured
- [ ] Network policies enforced

### Performance
- [ ] Database indexed
- [ ] Caching configured (Redis)
- [ ] CDN for static assets
- [ ] Load testing completed
- [ ] Resource limits set
- [ ] Monitoring/logging enabled

### Reliability
- [ ] Health checks working
- [ ] Auto-recovery enabled
- [ ] Disaster recovery plan
- [ ] Incident response plan
- [ ] Backup & restore tested

### Operational
- [ ] Documentation complete
- [ ] Team trained
- [ ] Runbooks created
- [ ] On-call rotation setup
- [ ] Alerting configured

---

## Monitoring & Logging

### Kubernetes Metrics
```bash
# View resource usage
kubectl top pods -n smartbudget
kubectl top nodes

# Pod events
kubectl get events -n smartbudget --sort-by='.lastTimestamp'
```

### Application Logs
```bash
# View logs
kubectl logs -n smartbudget deployment/smartbudget

# Stream logs
kubectl logs -n smartbudget deployment/smartbudget -f

# Previous pod logs (crashed pod)
kubectl logs -n smartbudget <pod-name> --previous

# Logs from specific container
kubectl logs -n smartbudget <pod-name> -c next-app
```

### Prometheus Integration
- Metrics available at pod.status.podIP:3000/metrics
- Configured in deployment annotations

---

## Troubleshooting

### Pod won't start
```bash
# Check events
kubectl describe pod <pod-name> -n smartbudget

# Check logs
kubectl logs <pod-name> -n smartbudget

# Check image pull
kubectl get events -n smartbudget
```

### High memory/CPU
```bash
# Check if autoscaling is working
kubectl get hpa smartbudget-hpa -n smartbudget

# Check actual vs requested resources
kubectl top pods -n smartbudget

# Increase limits in deployment.yaml
```

### Database connection errors
```bash
# Verify secrets
kubectl get secret app-secrets -n smartbudget -o yaml

# Test connectivity
kubectl exec -it <pod-name> -n smartbudget -- \
  psql $DATABASE_URL -c "SELECT 1;"
```

### Ingress not working
```bash
# Check ingress
kubectl describe ingress smartbudget-ingress -n smartbudget

# Check ingress controller
kubectl get pods -n ingress-nginx

# Check certificate
kubectl describe certificate -n smartbudget
```

---

## Useful Commands

```bash
# Deployment
kubectl apply -f k8s/
kubectl delete -f k8s/
kubectl rollout restart deployment/smartbudget -n smartbudget

# Debugging
kubectl exec -it <pod> -n smartbudget -- /bin/sh
kubectl cp <pod>:/app/logs ./logs -n smartbudget

# Scaling
kubectl scale deployment smartbudget --replicas=5 -n smartbudget
kubectl autoscale deployment smartbudget --min=3 --max=10 -n smartbudget

# Port Forwarding
kubectl port-forward -n smartbudget svc/smartbudget-service 3000:80
kubectl port-forward -n smartbudget pod/<pod-name> 3000:3000

# Cleanup
kubectl delete all -n smartbudget
kubectl delete namespace smartbudget
```

---

## Support

- Kubernetes docs: https://kubernetes.io/docs/
- Next.js deployment: https://nextjs.org/docs/deployment
- Docker docs: https://docs.docker.com/
- Ingress-nginx: https://kubernetes.github.io/ingress-nginx/
