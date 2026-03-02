# GitHub Actions Setup Guide

## Overview

This directory contains automated deployment workflows for multiple cloud platforms:

```
.github/workflows/
├── build-test.yml           # Build & test on push/PR
├── deploy-vercel.yml        # Deploy to Vercel
├── deploy-railway.yml       # Deploy to Railway.app
├── deploy-digitalocean.yml  # Deploy to DigitalOcean
├── deploy-aws-eks.yml       # Deploy to AWS EKS
└── deploy-gke.yml           # Deploy to Google Cloud
```

## Setup Instructions

### 1. Basic Setup (All Platforms)

```bash
# 1. Push code to GitHub
git add .
git commit -m "Add cloud deployment"
git push origin main

# 2. Go to Settings > Secrets and variables > Actions
# Add these secrets...
```

### 2. Platform-Specific Setup

#### **Vercel** ⭐ Easiest

```bash
# Get Vercel token
vercel tokens create

# Add to GitHub Secrets:
VERCEL_TOKEN=your_token_here

# That's it! Auto-deploys on push
```

**Secrets needed:**
- `VERCEL_TOKEN` - From https://vercel.com/account/tokens

---

#### **Railway.app**

```bash
# Get Railway token
railway token

# Add to GitHub Secrets:
RAILWAY_TOKEN=your_token_here

# Optional (for Slack notifications):
SLACK_WEBHOOK=https://hooks.slack.com/...
```

**Secrets needed:**
- `RAILWAY_TOKEN` - From https://railway.app/account/tokens
- `SLACK_WEBHOOK` - (Optional) From your Slack workspace

---

#### **DigitalOcean**

```bash
# 1. Create Personal Access Token
# https://cloud.digitalocean.com/account/api/tokens
TOKEN=dop_v1_xxxxxxxx

# 2. Get registry name
# https://cloud.digitalocean.com/registry
REGISTRY_NAME=smartbudget

# 3. Add to GitHub Secrets:
DIGITALOCEAN_TOKEN=dop_v1_xxxxxxxx
DIGITALOCEAN_USERNAME=your_email@example.com
DIGITALOCEAN_REGISTRY=smartbudget

# Optional:
SLACK_WEBHOOK=https://hooks.slack.com/...
```

**Secrets needed:**
- `DIGITALOCEAN_TOKEN` - Personal Access Token
- `DIGITALOCEAN_USERNAME` - Your email
- `DIGITALOCEAN_REGISTRY` - Registry name (e.g., smartbudget)
- `SLACK_WEBHOOK` - (Optional)

**Pre-requisites:**
- DOKS cluster created: `doctl kubernetes cluster create smartbudget ...`
- Container registry created: `doctl registry create smartbudget`

---

#### **AWS EKS**

```bash
# 1. Create IAM user with ECS/ECR permissions
# - AmazonEC2ContainerRegistryFullAccess
# - AmazonECS_FullAccess
# - AmazonEKS_FullAccess (or specific policy)

# 2. Get access keys
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# 3. Create ECR repository
aws ecr create-repository --repository-name smartbudget

# 4. Add to GitHub Secrets:
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Optional:
SLACK_WEBHOOK=https://hooks.slack.com/...
```

**Secrets needed:**
- `AWS_ACCESS_KEY_ID` - IAM credentials
- `AWS_SECRET_ACCESS_KEY` - IAM credentials
- `SLACK_WEBHOOK` - (Optional)

**Pre-requisites:**
- EKS cluster: `eksctl create cluster --name smartbudget ...`
- ECR repository: `aws ecr create-repository --repository-name smartbudget`

---

#### **Google Cloud GKE**

```bash
# 1. Create GCP Service Account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# 2. Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# 3. Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com

# 4. Add to GitHub Secrets:
GCP_SA_KEY=$(cat key.json | base64 -w 0)
GCP_PROJECT_ID=your-project-id
```

**Secrets needed:**
- `GCP_SA_KEY` - Service account key (base64 encoded)
- `GCP_PROJECT_ID` - Your GCP project ID
- `SLACK_WEBHOOK` - (Optional)

**Pre-requisites:**
- GKE cluster: `gcloud container clusters create smartbudget ...`

---

### 3. Add Secrets to GitHub

#### Option A: Web UI

```
1. Go to: Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each secret:
   - Name: SECRET_NAME
   - Value: secret_value
4. Click "Add secret"
```

#### Option B: GitHub CLI

```bash
# Install GitHub CLI
choco install gh

# Authenticate
gh auth login

# Add secrets
gh secret set VERCEL_TOKEN
gh secret set DIGITALOCEAN_TOKEN
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
# etc...
```

#### Option C: Script

```bash
#!/bin/bash

# Save as: add-secrets.sh
# Run: chmod +x add-secrets.sh && ./add-secrets.sh

gh secret set VERCEL_TOKEN --body "$(read -sp 'Vercel Token: ' token && echo $token)"
gh secret set DIGITALOCEAN_TOKEN --body "$(read -sp 'DO Token: ' token && echo $token)"
# Add more as needed
```

---

## Environment Variables

These go in your **repository .env file** (NOT as GitHub Secrets):

```env
# .env (local development)
NODE_ENV=development
DATABASE_URL=postgresql://...neon.tech/...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-prod
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GROQ_API_KEY=...
```

---

## Triggering Deployments

### Automatic (on push)
```bash
git push origin main
# Workflow runs automatically!
```

### Manual (from GitHub UI)
```
1. Go to: Actions > Select workflow
2. Click "Run workflow"
3. Select branch & click "Run"
```

### Manual (GitHub CLI)
```bash
gh workflow run deploy-vercel.yml
gh workflow run deploy-digitalocean.yml
gh workflow run deploy-aws-eks.yml
# etc...
```

---

## Monitoring Deployments

### View Workflow Status
```
Settings > Actions > Workflows
Select a workflow to view runs
```

### GitHub CLI
```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log

# Watch deployment
gh run watch <run-id>
```

### Slack Notifications

Add to repository secrets:
```
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Get webhook:
1. Go to your Slack workspace
2. Create incoming webhook: https://api.slack.com/messaging/webhooks
3. Copy webhook URL to GitHub secret

---

## Troubleshooting

### Workflow Not Running

```bash
# Check workflow syntax
gh workflow view deploy-vercel.yml

# Check if runs are disabled
Settings > Actions > Runner groups
# Should allow "All repositories"
```

### Secret Not Found

```bash
# List all secrets
gh secret list

# Verify secret name matches workflow
# Example: VERCEL_TOKEN in workflow, but SECRET_VERCEL_TOKEN in GitHub?
```

### Deployment Failed

```bash
# View full logs
gh run view <run-id> --log

# Common issues:
# - Secret not set
# - Wrong secret name
# - Expired credentials
# - Insufficient permissions
```

---

## Workflow Descriptions

### build-test.yml

Runs on every push and PR:
- Install dependencies
- Run linting
- Type checking
- Build application
- Build Docker image
- Push to GitHub Container Registry

**Triggers:** `push`, `pull_request`

---

### deploy-vercel.yml

Deploy to Vercel:
- Pull environment info from Vercel
- Build project
- Deploy to production (if main branch)
- Comment PR with deployment URL

**Requires:** `VERCEL_TOKEN`
**Triggers:** `push` (main), `pull_request`

---

### deploy-railway.yml

Deploy to Railway.app:
- Build and deploy in one command
- Send Slack notification

**Requires:** `RAILWAY_TOKEN`
**Triggers:** `push` (main)

---

### deploy-digitalocean.yml

Deploy to DigitalOcean:
- Build Docker image
- Push to DigitalOcean Container Registry
- Update Kubernetes deployment
- Wait for rollout
- Send Slack notification

**Requires:** `DIGITALOCEAN_TOKEN`, `DIGITALOCEAN_USERNAME`, `DIGITALOCEAN_REGISTRY`
**Triggers:** `push` (main), manual

---

### deploy-aws-eks.yml

Deploy to AWS EKS:
- Configure AWS credentials
- Build Docker image
- Push to ECR
- Update Kubernetes deployment
- Wait for rollout
- Send Slack notification

**Requires:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
**Triggers:** `push` (main), manual

---

### deploy-gke.yml

Deploy to Google Cloud GKE:
- Authenticate with GCP
- Build Docker image
- Push to GCR
- Update Kubernetes deployment
- Wait for rollout
- Send Slack notification

**Requires:** `GCP_SA_KEY`, `GCP_PROJECT_ID`
**Triggers:** `push` (main), manual

---

## Quick Start Checklist

### For Vercel
- [ ] Create Vercel project
- [ ] Generate API token
- [ ] Add `VERCEL_TOKEN` to GitHub
- [ ] Push to main → Auto-deploys!

### For DigitalOcean
- [ ] Create DOKS cluster
- [ ] Create container registry
- [ ] Generate personal token
- [ ] Add secrets to GitHub
- [ ] Push to main → Auto-deploys!

### For AWS
- [ ] Create EKS cluster
- [ ] Create ECR repository
- [ ] Create IAM user with permissions
- [ ] Add secrets to GitHub
- [ ] Push to main → Auto-deploys!

### For GCP
- [ ] Create GKE cluster
- [ ] Create service account
- [ ] Download service account key
- [ ] Add secrets to GitHub
- [ ] Push to main → Auto-deploys!

---

## Security Best Practices

✅ **DO:**
- Use repository secrets (never hardcode)
- Rotate credentials regularly
- Use least privilege IAM policies
- Enable branch protection
- Require pull request reviews before merge
- Monitor secret access logs

❌ **DON'T:**
- Commit secrets to git
- Use personal access tokens with full access
- Share secret values
- Use same token for multiple services
- Enable auto-merge without reviews
- Ignore failed workflow runs

---

## Support

- GitHub Actions docs: https://docs.github.com/actions
- Workflow syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- Troubleshooting: https://docs.github.com/en/actions/troubleshooting
