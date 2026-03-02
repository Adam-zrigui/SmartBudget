# Kubernetes Deployment Guide for SmartBudget

This directory contains all necessary Kubernetes manifests for deploying SmartBudget to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured to access your cluster
- Docker image registry (Docker Hub, ECR, GCR, etc.)
- Ingress controller (nginx recommended)
- cert-manager (for Let's Encrypt TLS)

## File Structure

```
k8s/
├── namespace.yaml           # Kubernetes namespace for the app
├── rbac.yaml               # ServiceAccount, ClusterRole, ClusterRoleBinding
├── deployment.yaml         # Main application deployment
├── service.yaml            # ClusterIP service
├── ingress.yaml            # Nginx ingress with TLS
├── configmap.yaml          # Non-secret configuration
├── secret.yaml             # Sensitive data (API keys, secrets)
├── hpa.yaml                # Horizontal Pod Autoscaler
└── pdb.yaml                # Pod Disruption Budget
```

## Quick Start

### 1. Build and Push Docker Image

```bash
# Build the image
docker build -t your-registry/smartbudget:latest .

# Push to your registry
docker push your-registry/smartbudget:latest
```

### 2. Update Configuration Files

Edit the following files with your actual values:

**k8s/deployment.yaml:**
- Change `image: smartbudget:latest` to your registry image

**k8s/ingress.yaml:**
- Replace `smartbudget.example.com` with your actual domain
- Ensure your ingress controller is installed

**k8s/secret.yaml:**
- Add your actual secret values:
  - NEXTAUTH_SECRET (generate: `openssl rand -base64 32`)
  - DATABASE_URL (from Neon)
  - GOOGLE_CLIENT_ID and SECRET
  - GROQ_API_KEY

**k8s/configmap.yaml:**
- Update NEXTAUTH_URL to your domain

### 3. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create RBAC resources
kubectl apply -f k8s/rbac.yaml

# Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# Create Secrets (IMPORTANT: Update with real values first!)
kubectl apply -f k8s/secret.yaml

# Deploy the application
kubectl apply -f k8s/deployment.yaml

# Create service
kubectl apply -f k8s/service.yaml

# Create autoscaler
kubectl apply -f k8s/hpa.yaml

# Create disruption budget
kubectl apply -f k8s/pdb.yaml

# Create ingress
kubectl apply -f k8s/ingress.yaml

# Or deploy all at once:
kubectl apply -f k8s/
```

### 4. Verify Deployment

```bash
# Check namespace
kubectl get namespace
kubectl get ns smartbudget

# Check pods
kubectl get pods -n smartbudget
kubectl describe pod <pod-name> -n smartbudget

# Check service
kubectl get svc -n smartbudget

# Check ingress
kubectl get ingress -n smartbudget
kubectl describe ingress smartbudget-ingress -n smartbudget

# View logs
kubectl logs -n smartbudget deployment/smartbudget -f
```

## Certificate Management

For HTTPS with Let's Encrypt:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment smartbudget --replicas=5 -n smartbudget
```

### Automatic Scaling (via HPA)

The HPA is configured to:
- Minimum 3 replicas
- Maximum 10 replicas
- Scale at 70% CPU or 80% memory utilization
- Already deployed via `hpa.yaml`

## Updates & Rolling Deployment

```bash
# Update image (will trigger rolling update)
kubectl set image deployment/smartbudget next-app=your-registry/smartbudget:v2 -n smartbudget

# Monitor rollout
kubectl rollout status deployment/smartbudget -n smartbudget

# Rollback if needed
kubectl rollout undo deployment/smartbudget -n smartbudget
```

## Health Checks

The deployment includes:
- **Liveness Probe:** Restarts pod if app stops responding (30s initial, 10s interval)
- **Readiness Probe:** Removes from load balancing if not ready (10s initial, 5s interval)

## Resource Limits

Default resource requests/limits:
- CPU: 250m request / 500m limit
- Memory: 512Mi request / 1Gi limit

Adjust in `deployment.yaml` based on your load testing.

## Environment Variables

Core environment variables (see deployment.yaml):
- `NODE_ENV`: production
- `NEXTAUTH_URL`: Your domain URL
- `NEXTAUTH_SECRET`: Secret key for NextAuth
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID`: Google OAuth ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth secret
- `GROQ_API_KEY`: Groq AI API key

## Networking

- **Service Type:** ClusterIP (backend only)
- **Ingress:** NGINX with TLS
- **Port:** 80 (exposed via service)
- **Session Affinity:** ClientIP (30min timeout)

## Security Defaults

- Non-root container (UID 1001)
- Read-only root filesystem
- Dropped ALL capabilities
- Pod Anti-Affinity for resilience
- Network policies can be added

## Monitoring & Logging

Endpoints available:
- Health check: GET /
- Metrics: Prometheus compatible (annotations in pod spec)

## Troubleshooting

### Pod won't start
```bash
kubectl describe pod <name> -n smartbudget
kubectl logs <name> -n smartbudget
```

### Image pull errors
```bash
# Check image exists and is accessible
docker images
kubectl get events -n smartbudget
```

### Connection errors to database
```bash
# Verify secrets are set
kubectl get secret app-secrets -n smartbudget -o yaml
```

### Ingress not working
```bash
kubectl describe ingress smartbudget-ingress -n smartbudget
kubectl get events -n smartbudget
```

## Production Checklist

- [ ] Update all secrets in `secret.yaml`
- [ ] Configure your domain in `ingress.yaml` and `configmap.yaml`
- [ ] Build and push Docker image to your registry
- [ ] Update image reference in `deployment.yaml`
- [ ] Install ingress controller
- [ ] Install cert-manager
- [ ] Test on staging first
- [ ] Enable RBAC in your cluster
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy for database
- [ ] Test disaster recovery
- [ ] Document your deployment process

## Support

For issues, check:
1. Pod logs: `kubectl logs -n smartbudget` 
2. Pod status: `kubectl describe pod -n smartbudget`
3. Events: `kubectl get events -n smartbudget`
4. Ingress status: `kubectl describe ingress -n smartbudget`

## Docker Compose (Local Development)

For local development without Kubernetes:

```bash
docker-compose up -d
```

This starts:
- Next.js app (port 3000)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
