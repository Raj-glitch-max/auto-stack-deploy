# 🚀 Deployment Guide

Complete guide for deploying AutoStack to AWS EKS with CI/CD automation.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Deployment](#infrastructure-deployment)
3. [Application Deployment](#application-deployment)
4. [CI/CD Setup](#cicd-setup)
5. [Post-Deployment](#post-deployment)

---

## 🔧 Prerequisites

### **Required Tools**
```bash
# AWS CLI
aws --version  # v2.x required

# kubectl
kubectl version --client

# Terraform
terraform version  # v1.5+

# Helm
helm version  # v3+
```

### **AWS Configuration**
```bash
# Configure AWS credentials
aws configure

# Verify access
aws sts get-caller-identity
```

### **GitHub Repository**
- Fork or clone: https://github.com/Raj-glitch-max/auto-stack-deploy
- Ensure you have push access

---

## ☁️ Infrastructure Deployment

### **Step 1: Deploy with Terraform**

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Deploy infrastructure
terraform apply -auto-approve
```

**What gets created:**
- VPC with public/private subnets (2 AZs)
- EKS cluster (Kubernetes 1.28)
- EKS node group (3x t3.small, autoscaling 1-3)
- RDS PostgreSQL (db.t3.micro)
- ECR repositories (frontend & backend)
- Jenkins EC2 instance (t3.micro)
- IAM roles and policies
- CloudWatch log groups
- SNS topic for alerts

**Duration**: ~15 minutes

### **Step 2: Configure kubectl**

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --name autostack-prod-eks \
  --region ap-south-1

# Verify connection
kubectl get nodes
```

Expected output:
```
NAME                                          STATUS   ROLES    AGE   VERSION
ip-10-0-1-123.ap-south-1.compute.internal    Ready    <none>   5m    v1.28.x
ip-10-0-2-456.ap-south-1.compute.internal    Ready    <none>   5m    v1.28.x
ip-10-0-3-789.ap-south-1.compute.internal    Ready    <none>   5m    v1.28.x
```

### **Step 3: Verify Add-ons**

```bash
# Check all add-ons
kubectl get pods -A

# Verify specific add-ons
kubectl get pods -n kube-system | grep metrics-server
kubectl get pods -n kube-system | grep cluster-autoscaler
kubectl get pods -n kube-system | grep aws-load-balancer-controller
kubectl get pods -n argocd | grep argocd
```

All pods should be `Running`.

---

## 📦 Application Deployment

### **Method 1: ArgoCD (GitOps) - Recommended**

#### **Step 1: Access ArgoCD**

```bash
# Port forward ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Open: http://localhost:8080
- Username: `admin`
- Password: (from above command)

#### **Step 2: Verify Applications**

```bash
# Check applications
kubectl get applications -n argocd

# Should show:
# NAME                 SYNC STATUS   HEALTH STATUS
# autostack-backend    Synced        Healthy
# autostack-frontend   Synced        Healthy
```

#### **Step 3: Verify Deployments**

```bash
# Check pods
kubectl get pods -n default

# Check services
kubectl get svc -n default

# Check load balancers
kubectl get svc -n default | grep LoadBalancer
```

#### **Step 4: Get Public URLs**

```bash
# Frontend URL
kubectl get svc autostack-frontend -n default \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Backend URL
kubectl get svc autostack-backend -n default \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**Note**: Load Balancers take 2-3 minutes to provision.

### **Method 2: Manual Deployment**

```bash
# Build and push images
./build-and-push-images.ps1

# Apply Kubernetes manifests manually
kubectl apply -f infra/helm/autostack-frontend/templates/
kubectl apply -f infra/helm/autostack-backend/templates/
```

---

## 🤖 CI/CD Setup

### **Overview**

```
Developer Push → GitHub → Jenkins → Build → ECR → GitOps Update → ArgoCD Sync → EKS Deploy
```

### **Step 1: Access Jenkins**

```bash
# Get Jenkins URL (from Terraform output)
terraform output jenkins_url

# Or use public IP
# http://<jenkins-ec2-ip>:8080
```

**Get initial admin password:**
```bash
# SSH to Jenkins instance
ssh -i your-key.pem ec2-user@<jenkins-ip>

# Get password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### **Step 2: Install Jenkins Plugins**

Navigate to: `Jenkins → Manage Jenkins → Manage Plugins → Available`

Install:
1. Docker Pipeline
2. Git Plugin
3. GitHub Plugin
4. AWS Steps
5. Kubernetes CLI Plugin
6. Pipeline: Stage View
7. Credentials Binding Plugin

Click "Install without restart"

### **Step 3: Add Credentials**

#### **AWS Credentials**
1. Go to: `Manage Jenkins → Manage Credentials → (global) → Add Credentials`
2. Kind: `AWS Credentials`
3. ID: `aws-credentials`
4. Access Key ID: Your AWS access key
5. Secret Access Key: Your AWS secret key
6. Click "Create"

#### **GitHub Token**
1. Create token: https://github.com/settings/tokens/new
   - Scopes: `repo`, `workflow`, `write:packages`
2. In Jenkins: `Add Credentials`
3. Kind: `Secret text`
4. ID: `github-token`
5. Secret: Paste your token
6. Click "Create"

### **Step 4: Create Pipeline Jobs**

#### **Backend Pipeline**
1. `New Item → Pipeline`
2. Name: `autostack-backend-deploy`
3. Build Triggers: ✓ `GitHub hook trigger for GITScm polling`
4. Pipeline:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/Raj-glitch-max/auto-stack-deploy.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile.backend`
5. Save

#### **Frontend Pipeline**
1. Repeat above steps
2. Name: `autostack-frontend-deploy`
3. Script Path: `Jenkinsfile.frontend`
4. Save

### **Step 5: Configure GitHub Webhook**

1. Go to: `https://github.com/Raj-glitch-max/auto-stack-deploy/settings/hooks/new`
2. Payload URL: `http://<jenkins-ip>:8080/github-webhook/`
3. Content type: `application/json`
4. Events: `Just the push event`
5. Active: ✓
6. Add webhook

### **Step 6: Test CI/CD**

```bash
# Make a small change
echo "// CI/CD test $(date)" >> autostack-backend/backend/main.py

# Commit and push
git add .
git commit -m "test: trigger CI/CD"
git push origin main

# Watch Jenkins
# http://<jenkins-ip>:8080/job/autostack-backend-deploy/

# Watch ArgoCD sync
kubectl get applications -n argocd -w

# Watch pods update
kubectl get pods -n default -w
```

**Total deployment time**: ~5 minutes from push to production

---

## 🔄 Deployment Workflow

### **Automatic Deployment** (after CI/CD setup)

```bash
# 1. Make code changes
vim autostack-backend/backend/main.py

# 2. Commit
git add .
git commit -m "feat: new feature"

# 3. Push (this triggers everything!)
git push origin main

# 4. Jenkins automatically:
#    - Builds Docker image
#    - Pushes to ECR
#    - Updates GitOps repo
#
# 5. ArgoCD automatically:
#    - Detects change
#    - Syncs application
#
# 6. Kubernetes:
#    - Rolling update
#    - Zero downtime
```

### **Manual Deployment** (without CI/CD)

```bash
# 1. Build images
docker build -t 367749063363.dkr.ecr.ap-south-1.amazonaws.com/autostack-backend:v1.0 ./autostack-backend/backend
docker build -t 367749063363.dkr.ecr.ap-south-1.amazonaws.com/autostack-frontend:v1.0 ./autostack-frontend

# 2. Push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 367749063363.dkr.ecr.ap-south-1.amazonaws.com
docker push 367749063363.dkr.ecr.ap-south-1.amazonaws.com/autostack-backend:v1.0
docker push 367749063363.dkr.ecr.ap-south-1.amazonaws.com/autostack-frontend:v1.0

# 3. Update image tag in ArgoCD apps
vim infra/argocd/apps/backend-app.yaml
# Change: tag: "v1.0"

# 4. Commit and push
git add .
git commit -m "deploy: v1.0"
git push origin main

# 5. Sync ArgoCD
kubectl -n argocd patch application autostack-backend \
  --type merge -p '{"operation":{"sync":{"revision":"HEAD"}}}'
```

---

## ✅ Post-Deployment

### **Health Checks**

```bash
# Check all resources
kubectl get all -n default

# Check pod health
kubectl get pods -n default

# Check service endpoints
kubectl get endpoints -n default

# Check ArgoCD sync status
kubectl get applications -n argocd
```

### **Test Applications**

```bash
# Get URLs
FRONTEND_URL=$(kubectl get svc autostack-frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
BACKEND_URL=$(kubectl get svc autostack-backend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test backend
curl http://$BACKEND_URL/health

# Test frontend (open in browser)
open http://$FRONTEND_URL

# Test API docs
open http://$BACKEND_URL/docs
```

### **Monitor Logs**

```bash
# Backend logs
kubectl logs -f deployment/autostack-backend -n default

# Frontend logs
kubectl logs -f deployment/autostack-frontend -n default

# ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```

### **Scaling**

```bash
# Manual scaling
kubectl scale deployment autostack-backend --replicas=3 -n default

# Check HPA (Horizontal Pod Autoscaler)
kubectl get hpa -n default

# Check cluster autoscaling
kubectl get nodes
```

---

## 🔄 Updates & Rollbacks

### **Update Application**

```bash
# For automatic updates: just git push (if CI/CD configured)
git push origin main

# For manual updates: update image tag and sync ArgoCD
kubectl -n argocd patch application autostack-backend \
  --type merge -p '{"operation":{"sync":{"revision":"HEAD"}}}'
```

### **Rollback**

```bash
# Rollback deployment
kubectl rollout undo deployment/autostack-backend -n default

# Rollback to specific revision
kubectl rollout undo deployment/autostack-backend -n default --to-revision=2

# Check rollout history
kubectl rollout history deployment/autostack-backend -n default
```

### **ArgoCD Rollback**

```bash
# Sync to specific Git commit
kubectl -n argocd patch application autostack-backend \
  --type merge -p '{"spec":{"source":{"targetRevision":"<commit-hash>"}}}'
```

---

## 🔒 Security Best Practices

### **Secrets Management**

```bash
# Create Kubernetes secrets
kubectl create secret generic autostack-secrets \
  --from-literal=jwt-secret=your-secret-key \
  --from-literal=database-password=your-db-password \
  -n default

# Use AWS Secrets Manager (recommended for production)
aws secretsmanager create-secret \
  --name autostack/prod/jwt-secret \
  --secret-string "your-secret-key"
```

### **IAM Roles**

- Use IRSA (IAM Roles for Service Accounts)
- Principle of least privilege
- Separate roles for each service

### **Network Security**

- VPC isolation
- Security groups
- Network policies
- Private subnets for data layer

---

## 💰 Cost Optimization

### **Current Setup**: ~$162/month

**Optimization Tips:**
1. Use Spot instances for non-production
2. Enable cluster autoscaler (already done)
3. Right-size resources (adjust CPU/memory limits)
4. Use Reserved Instances for predictable workloads
5. Enable S3 lifecycle policies
6. Review CloudWatch log retention

---

## 📊 Monitoring

### **CloudWatch**

```bash
# View logs
aws logs tail /aws/eks/autostack-prod-eks/cluster --follow

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### **Prometheus + Grafana** (Optional)

```bash
# Deploy Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace

# Access Grafana
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80

# Default credentials: admin/prom-operator
```

---

## 🆘 Emergency Procedures

### **Scale Down (Cost Saving)**

```bash
# Scale deployments to 0
kubectl scale deployment --all --replicas=0 -n default

# Scale node group to 1
aws eks update-nodegroup-config \
  --cluster-name autostack-prod-eks \
  --nodegroup-name autostack-prod-node-group \
  --scaling-config minSize=1,maxSize=1,desiredSize=1
```

### **Scale Up (Resume)**

```bash
# Scale deployments back
kubectl scale deployment autostack-backend --replicas=1 -n default
kubectl scale deployment autostack-frontend --replicas=1 -n default

# Scale node group
aws eks update-nodegroup-config \
  --cluster-name autostack-prod-eks \
  --nodegroup-name autostack-prod-node-group \
  --scaling-config minSize=1,maxSize=3,desiredSize=2
```

### **Complete Teardown**

```bash
# Delete applications from ArgoCD
kubectl delete application autostack-backend -n argocd
kubectl delete application autostack-frontend -n argocd

# Destroy infrastructure
cd infra/terraform
terraform destroy -auto-approve
```

---

## 📚 Next Steps

1. **Enable HTTPS**: Add ACM certificate and configure ALB
2. **Custom Domain**: Configure Route53 with your domain
3. **Monitoring**: Set up Prometheus + Grafana
4. **Alerting**: Configure CloudWatch alarms and SNS notifications
5. **Backup**: Set up automated EBS and RDS snapshots
6. **Multi-Region**: Deploy to multiple AWS regions for HA

---

**For issues during deployment, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
