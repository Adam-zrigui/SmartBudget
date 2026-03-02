#!/bin/bash

# SmartBudget Kubernetes Deployment Script
# Usage: ./deploy.sh <environment> <image-tag>
# Example: ./deploy.sh production latest

set -e

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
REGISTRY=${DOCKER_REGISTRY:-your-registry}
APP_NAME="smartbudget"
NAMESPACE="${APP_NAME}"
IMAGE="${REGISTRY}/${APP_NAME}:${IMAGE_TAG}"

echo "========================================="
echo "SmartBudget Kubernetes Deployment"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Image: $IMAGE"
echo "Namespace: $NAMESPACE"
echo "========================================="

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to Kubernetes cluster"
    exit 1
fi

echo "✅ Kubernetes cluster connected"

# Create namespace if it doesn't exist
echo "Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
echo "✅ Namespace ready"

# Apply manifests in order
echo "Deploying configuration..."
kubectl apply -f k8s/namespace.yaml
echo "✅ Namespace created"

kubectl apply -f k8s/rbac.yaml
echo "✅ RBAC configured"

kubectl apply -f k8s/configmap.yaml
echo "✅ ConfigMap created"

# Check if secrets exist, if not create from template
if ! kubectl get secret app-secrets -n $NAMESPACE &> /dev/null; then
    echo "⚠️  Secrets not found. Please update k8s/secret.yaml with your actual values"
    echo "   Then run: kubectl apply -f k8s/secret.yaml"
    exit 1
fi
echo "✅ Secrets verified"

# Update deployment image
echo "Updating deployment image to: $IMAGE"
kubectl set image deployment/smartbudget next-app=$IMAGE -n $NAMESPACE --record || true

# Apply deployment and other configs
kubectl apply -f k8s/deployment.yaml
echo "✅ Deployment created"

kubectl apply -f k8s/service.yaml
echo "✅ Service created"

kubectl apply -f k8s/hpa.yaml
echo "✅ Horizontal Pod Autoscaler configured"

kubectl apply -f k8s/pdb.yaml
echo "✅ Pod Disruption Budget set"

kubectl apply -f k8s/ingress.yaml
echo "✅ Ingress configured"

# Wait for deployment to be ready
echo ""
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/smartbudget -n $NAMESPACE --timeout=5m

echo ""
echo "========================================="
echo "✅ Deployment completed successfully!"
echo "========================================="
echo ""
echo "Useful commands:"
echo "  View logs:      kubectl logs -n $NAMESPACE deployment/$APP_NAME -f"
echo "  Check status:   kubectl get all -n $NAMESPACE"
echo "  Describe:       kubectl describe pod -n $NAMESPACE"
echo "  Port forward:   kubectl port-forward -n $NAMESPACE svc/$APP_NAME-service 3000:80"
echo ""

# Show pod status
echo "Current pod status:"
kubectl get pods -n $NAMESPACE
