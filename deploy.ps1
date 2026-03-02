# SmartBudget Kubernetes Deployment Script (PowerShell)
# Usage: .\deploy.ps1 -Environment production -ImageTag latest -Registry your-registry

param(
    [string]$Environment = "staging",
    [string]$ImageTag = "latest",
    [string]$Registry = "your-registry"
)

$ErrorActionPreference = "Stop"

$AppName = "smartbudget"
$Namespace = $AppName
$Image = "$Registry/$AppName$ImageTag"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SmartBudget Kubernetes Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Image: $Image"
Write-Host "Namespace: $Namespace"
Write-Host "=========================================" -ForegroundColor Cyan

# Check if kubectl is installed
try {
    kubectl version --client | Out-Null
    Write-Host "✅ kubectl found" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl is not installed" -ForegroundColor Red
    exit 1
}

# Check cluster connection
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Connected to Kubernetes cluster" -ForegroundColor Green
} catch {
    Write-Host "❌ Not connected to Kubernetes cluster" -ForegroundColor Red
    exit 1
}

# Create namespace
Write-Host "Creating namespace..." -ForegroundColor Yellow
kubectl create namespace $Namespace --dry-run=client -o yaml | kubectl apply -f -
Write-Host "✅ Namespace ready" -ForegroundColor Green

# Apply manifests in order
Write-Host "Deploying configuration..." -ForegroundColor Yellow

Write-Host "Applying namespace..."
kubectl apply -f k8s/namespace.yaml
Write-Host "✅ Namespace created" -ForegroundColor Green

Write-Host "Applying RBAC..."
kubectl apply -f k8s/rbac.yaml
Write-Host "✅ RBAC configured" -ForegroundColor Green

Write-Host "Applying ConfigMap..."
kubectl apply -f k8s/configmap.yaml
Write-Host "✅ ConfigMap created" -ForegroundColor Green

# Check if secrets exist
$secretExists = kubectl get secret app-secrets -n $Namespace 2>$null
if (-not $secretExists) {
    Write-Host "⚠️  Secrets not found. Please update k8s/secret.yaml with your actual values" -ForegroundColor Yellow
    Write-Host "   Then run: kubectl apply -f k8s/secret.yaml" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Secrets verified" -ForegroundColor Green

# Update deployment image
Write-Host "Updating deployment image to: $Image" -ForegroundColor Yellow
kubectl set image deployment/smartbudget next-app=$Image -n $Namespace --record 2>$null
Write-Host "✅ Image updated" -ForegroundColor Green

# Apply deployment and other configs
Write-Host "Applying deployment..."
kubectl apply -f k8s/deployment.yaml
Write-Host "✅ Deployment created" -ForegroundColor Green

Write-Host "Applying service..."
kubectl apply -f k8s/service.yaml
Write-Host "✅ Service created" -ForegroundColor Green

Write-Host "Applying HPA..."
kubectl apply -f k8s/hpa.yaml
Write-Host "✅ Horizontal Pod Autoscaler configured" -ForegroundColor Green

Write-Host "Applying PDB..."
kubectl apply -f k8s/pdb.yaml
Write-Host "✅ Pod Disruption Budget set" -ForegroundColor Green

Write-Host "Applying ingress..."
kubectl apply -f k8s/ingress.yaml
Write-Host "✅ Ingress configured" -ForegroundColor Green

# Wait for deployment
Write-Host ""
Write-Host "Waiting for deployment to be ready..." -ForegroundColor Yellow
kubectl rollout status deployment/smartbudget -n $Namespace --timeout=5m

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:      kubectl logs -n $Namespace deployment/$AppName -f"
Write-Host "  Check status:   kubectl get all -n $Namespace"
Write-Host "  Describe:       kubectl describe pod -n $Namespace"
Write-Host "  Port forward:   kubectl port-forward -n $Namespace svc/$AppName-service 3000:80"
Write-Host ""

# Show pod status
Write-Host "Current pod status:" -ForegroundColor Cyan
kubectl get pods -n $Namespace
