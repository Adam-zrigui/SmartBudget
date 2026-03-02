# Cloud Deployment Options for SmartBudget

## Recommended Cloud Solutions

### 1. **Vercel** (Default for Next.js) ⭐ EASIEST
- **Best For**: Next.js applications
- **Cost**: $0 - $150/month
- **Setup Time**: 5 minutes
- **Pros**: One-click deployment, automatic scaling, serverless
- **[Go to Vercel Setup](#vercel)**

### 2. **AWS EKS** (Kubernetes)
- **Best For**: Production, enterprise, complex workloads
- **Cost**: $73/month + compute
- **Setup Time**: 30 minutes
- **Pros**: Full control, auto-scaling, VPC, RDS integration
- **[Go to AWS EKS Setup](#aws-eks)**

### 3. **Google Cloud GKE**
- **Best For**: Teams already using GCP
- **Cost**: Similar to AWS
- **Setup Time**: 20 minutes
- **Pros**: Simple UI, Google Cloud integration
- **[Go to GKE Setup](#gke)**

### 4. **DigitalOcean DOKS**
- **Best For**: Simplicity and affordability
- **Cost**: $12 - $100/month
- **Setup Time**: 15 minutes
- **Pros**: Simple API, good docs, affordable
- **[Go to DigitalOcean Setup](#digitalocean)**

### 5. **Railway.app** (Easiest non-Vercel)
- **Best For**: Quick deployment
- **Cost**: Pay-as-you-go ($5+/month)
- **Setup Time**: 3 minutes
- **Pros**: GitHub integration, one-command deploy
- **[Go to Railway Setup](#railway)**

---

## Vercel

### Quick Start

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add
```

### Environment Variables

Set in Vercel Dashboard (`Settings > Environment Variables`):

```
DATABASE_URL=postgresql://...neon.tech/...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GROQ_API_KEY=...
```

### Domain Setup

```
Dashboard > Settings > Domains > Add custom domain
```

### GitHub Integration

```bash
# Auto-deploy from git
# 1. Push to GitHub
git push origin main

# 2. Vercel auto-deploys on push
# 3. Preview URL for each PR
```

**Cost**: Free tier available, Pro ($20/mo) for custom domains

---

## AWS EKS

### Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-windows.msi" -o "AWSCLIV2.msi"
msiexec.exe /i AWSCLIV2.msi

# Install eksctl
choco install eksctl

# Install kubectl
choco install kubernetes-cli

# Configure AWS credentials
aws configure
```

### Create EKS Cluster

```bash
# Create cluster (10 minutes)
eksctl create cluster \
  --name smartbudget \
  --region us-east-1 \
  --nodegroup-name smartbudget-nodes \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --instance-types t3.medium

# Verify
kubectl get nodes
```

### Push Image to ECR

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name smartbudget --region us-east-1

# 2. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 3. Build and push
docker build -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smartbudget:latest .
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smartbudget:latest
```

### Deploy to EKS

```bash
# Replace image in deployment
sed -i 's|smartbudget:latest|YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smartbudget:latest|g' k8s/deployment.yaml

# Deploy (using existing k8s manifests)
kubectl apply -f k8s/

# Verify
kubectl get pods -n smartbudget
```

### Database (RDS)

```bash
# Create PostgreSQL RDS
aws rds create-db-instance \
  --db-instance-identifier smartbudget-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123! \
  --allocated-storage 20

# Get connection string
aws rds describe-db-instances \
  --db-instance-identifier smartbudget-db \
  --query 'DBInstances[0].Endpoint'
```

### Load Balancer

```bash
# Update service to use LoadBalancer
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: smartbudget-lb
  namespace: smartbudget
spec:
  type: LoadBalancer
  selector:
    app: smartbudget
  ports:
  - port: 80
    targetPort: 3000
EOF

# Get external IP
kubectl get svc smartbudget-lb -n smartbudget
```

### Cost Estimate

- EKS cluster: $73/month
- EC2 (3x t3.medium): $100/month
- RDS (db.t3.micro): $30/month
- **Total: ~$200/month**

---

## Google Cloud GKE

### Prerequisites

```bash
# Install gcloud
# Download: https://cloud.google.com/sdk/docs/install

# Initialize
gcloud init

# Create project
gcloud projects create smartbudget-project
gcloud config set project smartbudget-project
```

### Create GKE Cluster

```bash
# Create cluster
gcloud container clusters create smartbudget \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials smartbudget --zone us-central1-a

# Verify
kubectl get nodes
```

### Push to Container Registry

```bash
# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Configure Docker
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/smartbudget-project/smartbudget:latest .
docker push gcr.io/smartbudget-project/smartbudget:latest
```

### Deploy

```bash
# Update image
sed -i 's|smartbudget:latest|gcr.io/smartbudget-project/smartbudget:latest|g' k8s/deployment.yaml

# Deploy
kubectl apply -f k8s/

# Get LoadBalancer IP
kubectl get svc -n smartbudget
```

### Cloud SQL (Database)

```bash
# Create Cloud SQL instance
gcloud sql instances create smartbudget-db \
  --database-version POSTGRES_15 \
  --tier db-t7g-micro \
  --region us-central1

# Get connection string
gcloud sql instances describe smartbudget-db --format="value(ipAddresses[0].ipAddress)"
```

### Cost Estimate

- GKE cluster: $73/month
- 3x n1-standard-2: $200/month
- Cloud SQL: $40/month
- **Total: ~$300/month**

---

## DigitalOcean DOKS

### Prerequisites

```bash
# Install doctl
choco install doctl

# Authenticate
doctl auth init
```

### Create DOKS Cluster

```bash
# Create cluster (5 minutes)
doctl kubernetes cluster create smartbudget \
  --region nyc3 \
  --node-pool name=smartbudget,size=s-2vcpu-4gb,count=3 \
  --auto-scale --min-nodes 1 --max-nodes 10

# Get kubeconfig
doctl kubernetes cluster kubeconfig save smartbudget

# Verify
kubectl get nodes
```

### Push to DigitalOcean Container Registry

```bash
# Create registry
doctl registry create smartbudget

# Login
doctl registry login

# Build and push
docker build -t registry.digitalocean.com/smartbudget/smartbudget:latest .
docker push registry.digitalocean.com/smartbudget/smartbudget:latest

# Add image pull secret
doctl registry create-docker-config smartbudget | \
  kubectl create secret generic digitalocean-registry \
  --from-file=.dockerconfigjson=/dev/stdin \
  --type=kubernetes.io/dockercfg \
  -n smartbudget
```

### Deploy

```bash
# Update image and imagePullSecrets in deployment
sed -i 's|smartbudget:latest|registry.digitalocean.com/smartbudget/smartbudget:latest|g' k8s/deployment.yaml

# Add imagePullSecrets to deployment.yaml:
# spec:
#   template:
#     spec:
#       imagePullSecrets:
#       - name: digitalocean-registry

kubectl apply -f k8s/
```

### Managed Database

```bash
# Create managed PostgreSQL
doctl databases create smartbudget-db \
  --engine pg \
  --region nyc3 \
  --num-nodes 1 \
  --size db-s-1vcpu-1gb

# Get connection string
doctl databases get smartbudget-db --format "Connection String" --no-header
```

### Cost Estimate

- DOKS cluster: $12/month
- 3x s-2vcpu-4gb: $48/month
- Managed Database: $12/month
- **Total: ~$70/month** ✅ Most affordable

---

## Railway.app

### Quick Start

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Link GitHub (optional but recommended)
```

### Connect GitHub

```bash
# Push to GitHub
git add .
git commit -m "Add Kubernetes config"
git push origin main

# Link: https://railway.app
# 1. New Project > Deploy from GitHub repo
# 2. Select: smartbudget repo
# 3. Auto-deploys on push
```

### Environment Variables

```bash
railway env add DATABASE_URL postgresql://...
railway env add NEXTAUTH_SECRET your-secret
railway env add NEXTAUTH_URL https://smartbudget.railway.app
railway env add GOOGLE_CLIENT_ID ...
railway env add GOOGLE_CLIENT_SECRET ...
railway env add GROQ_API_KEY ...
```

### Deploy

```bash
railway up

# Or enable GitHub auto-deploy
railway link
```

### Custom Domain

```bash
# In Railway Dashboard:
# 1. Settings > Domain > Add Custom Domain
# 2. Point DNS to Railway
```

### Cost Estimate

- First 500 hours free (covers small usage)
- Pay-as-you-go: $5+ /month
- **Total: $25-50/month typical**

---

## Comparison Table

| Platform | Cost | Setup | Scaling | Best For |
|----------|------|-------|---------|----------|
| **Vercel** | Free-20 | 5 min | Automatic | Next.js, simplicity |
| **Railway** | 5+ | 3 min | Automatic | Quick deploy |
| **DigitalOcean** | 70 | 15 min | Manual/HPA | Affordability |
| **AWS EKS** | 200+ | 30 min | Full control | Enterprise |
| **Google GKE** | 300+ | 20 min | Full control | GCP teams |

---

## Recommendation

**For SmartBudget:**

1. **Start with Vercel** ✅ 
   - Easiest
   - Free tier available
   - Perfect for Next.js

2. **Graduate to DigitalOcean** 💰
   - Most affordable
   - Uses your Kubernetes manifests
   - Excellent documentation

3. **Scale to AWS EKS** 🏢
   - Enterprise-grade
   - Maximum flexibility
   - EC2 + RDS integration

---

## Next Steps

**Choose one platform and I'll help you deploy:**

1. Ready Vercel? → I'll help you deploy today (5 min)
2. Ready DigitalOcean? → Full setup guide (15 min)
3. Ready AWS? → EKS cluster creation (30 min)
4. Want comparison? → I can demo all three

**Which cloud platform would you like to use?**
