# Docker & Kubernetes Setup for Budgeting App

This directory contains all the containerization and orchestration files for deploying the budgeting app to a cloud Kubernetes cluster (GKE). Docker is used **only for production deployment**, not for local development.

## Local Development

### Prerequisites
- Node.js 20+
- pnpm

### Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Create a `.env` file** with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your Neon DATABASE_URL and API keys
   ```

3. **Run Prisma migrations** (if needed):
   ```bash
   pnpm prisma migrate dev
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Access the app**:
   - Open `http://localhost:3000` in your browser.

6. **Stop the server**:
   - Press `Ctrl+C` in your terminal.

## Production Deployment to GKE

### Prerequisites
- Google Cloud Platform (GCP) account
- `gcloud` CLI installed and authenticated
- `kubectl` installed

### Setup

1. **Create a GKE cluster** (if not already created):
   ```bash
   gcloud container clusters create smartbudget-cluster \
     --zone=us-central1-a \
     --num-nodes=2 \
     --machine-type=n1-standard-1 \
     --enable-autoscaling \
     --min-nodes=1 \
     --max-nodes=5
   ```

2. **Set up GitHub Secrets** in your GitHub repository:
   - `GCP_SA_KEY`: Service account key JSON (for GCP authentication)
   - `GCP_PROJECT_ID`: Your GCP project ID
   - `NEXTAUTH_SECRET`: NextAuth secret
   - `DATABASE_URL`: Neon PostgreSQL connection string
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: OAuth credentials
   - `HF_API_KEY`: HuggingFace API key (required for assistant)
   - `HF_API_KEY` (optional): HuggingFace fallback


4. **Update K8s manifests**:
   - Edit `k8s/deployment.yaml`: change `your-registry/smartbudget:latest` to your GCR image path
   - Edit `k8s/configmap.yaml`: set your domain URL
   - Edit `k8s/ingress.yaml`: set your domain and enable TLS

5. **Deploy manually** (if not using GitHub Actions):
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

6. **Verify deployment**:
   ```bash
   kubectl get deployments
   kubectl get services
   kubectl logs deployment/smartbudget
   ```

### Automatic CI/CD with GitHub Actions

The workflow (`.github/workflows/deploy-gke.yml`) automatically:
1. Builds and pushes the Docker image to Google Container Registry (GCR)
2. Updates the GKE deployment with the new image
3. Waits for the rollout to complete

No further manual steps needed after pushing to the `main` or `develop` branch.

## File Structure

```
.
├── Dockerfile                    # Multi-stage build for Next.js (production only)
├── .dockerignore                 # Docker build exclusions
├── k8s/
│   ├── deployment.yaml           # K8s Deployment manifest
│   ├── service.yaml              # K8s Service manifest
│   ├── configmap.yaml            # K8s ConfigMap for non-sensitive config
│   ├── secret.yaml               # K8s Secret for sensitive data
│   └── ingress.yaml              # K8s Ingress for external access
└── .github/workflows/
    └── deploy-gke.yml            # GitHub Actions CI/CD pipeline
```

## Troubleshooting

### Local Development Issues
- Clear node_modules: `rm -r node_modules pnpm-lock.yaml && pnpm install`
- Check Node version: `node --version` (should be 20+)
- Port 3000 already in use: `pnpm dev --port 3001`

### Kubernetes Issues
- Check pod status: `kubectl describe pod <pod-name>`
- View logs: `kubectl logs <pod-name>`
- Port forward for debugging: `kubectl port-forward svc/smartbudget-service 3000:80`

### Image Pull Errors
Ensure the image path in `deployment.yaml` matches your GCR path format: `gcr.io/PROJECT_ID/smartbudget:TAG`

### Database Connection
Ensure your `DATABASE_URL` (Neon) is correctly configured and the K8s pod can reach it from the cloud.

## Environment Variables

### Key Variables for Containers
- `NODE_ENV`: Set to `production` in K8s, `development` in docker-compose
- `NEXTAUTH_URL`: Must match your deployment domain/URL
- `NEXTAUTH_SECRET`: Secure random string
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `GOOGLE_CLIENT_ID/SECRET`: OAuth credentials for Google sign-in
- `HF_API_KEY`: HuggingFace API key for AI assistant


## Scaling

To scale the app in K8s:
```bash
kubectl scale deployment smartbudget --replicas=5
```

Or update the `replicas` field in `k8s/deployment.yaml` and reapply.

## References
- [Docker documentation](https://docs.docker.com/)
- [Kubernetes documentation](https://kubernetes.io/docs/)
- [GKE quickstart](https://cloud.google.com/kubernetes-engine/docs/quickstart)
- [Next.js deployment docs](https://nextjs.org/docs/deployment)
