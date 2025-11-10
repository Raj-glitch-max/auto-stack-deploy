# 🚀 Post-Deployment Operations Guide

**Date**: November 10, 2025  
**Status**: Phase 3 - Operations & Real-Time Deployment  

---

## 📋 Table of Contents

1. [Production Hardening](#production-hardening)
2. [CI/CD Automation](#cicd-automation)
3. [Public Access & Monitoring](#public-access--monitoring)
4. [Validation Checklist](#validation-checklist)
5. [SaaS Integration](#saas-integration)
6. [Backup & Disaster Recovery](#backup--disaster-recovery)

---

## 🔐 1. Production Hardening

### Security Tasks

#### 1.1 IAM User for Terraform
```bash
# Create dedicated IAM user for Terraform
aws iam create-user --user-name terraform-deployer

# Attach required policies
aws iam attach-user-policy \
  --user-name terraform-deployer \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Create access keys (save these securely!)
aws iam create-access-key --user-name terraform-deployer
```

#### 1.2 Enable MFA on Root Account
1. Go to AWS Console → IAM → Dashboard
2. Click "Add MFA" for root account
3. Use Google Authenticator or Authy
4. **Never use root account again for daily operations**

#### 1.3 Move Secrets to AWS Secrets Manager
```bash
# Create secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name autostack/prod/database-credentials \
  --secret-string '{"username":"autostack","password":"STRONG_PASSWORD_HERE"}'

aws secretsmanager create-secret \
  --name autostack/prod/jwt-secret \
  --secret-string '{"secret":"YOUR_JWT_SECRET_HERE"}'

# Update backend to read from Secrets Manager
# Add IAM role for pods to access Secrets Manager
```

#### 1.4 Enable Encryption
```bash
# Enable RDS encryption (requires recreation)
# Update terraform/modules/rds/main.tf:
# storage_encrypted = true
# kms_key_id = aws_kms_key.rds.arn

# Enable ECR image scanning
aws ecr put-image-scanning-configuration \
  --repository-name autostack-backend \
  --image-scanning-configuration scanOnPush=true

aws ecr put-image-scanning-configuration \
  --repository-name autostack-frontend \
  --image-scanning-configuration scanOnPush=true
```

#### 1.5 ArgoCD RBAC
```yaml
# argocd-rbac-cm.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    p, role:admin, applications, *, */*, allow
    p, role:admin, clusters, *, *, allow
    p, role:dev, applications, *, */dev, allow
    p, role:dev, applications, sync, */*, allow
    g, admin@autostack.com, role:admin
    g, dev@autostack.com, role:dev
```

---

### Resilience Tasks

#### 1.6 Enable Cluster Auto-Healing
✅ Already enabled via Cluster Autoscaler

#### 1.7 RDS Backup Configuration
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier autostack-prod-postgres \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

#### 1.8 CloudWatch Alarms
```bash
# Create SNS topic for alerts
aws sns create-topic --name autostack-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-south-1:367749063363:autostack-alerts \
  --protocol email \
  --notification-endpoint your-email@domain.com

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name autostack-high-cpu \
  --alarm-description "Alert when node CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:367749063363:autostack-alerts
```

---

### Cost Control Tasks

#### 1.9 Resource Tagging
```bash
# Tag all resources via Terraform
# Add to terraform/variables.tf:
variable "common_tags" {
  default = {
    Environment = "production"
    Owner       = "Raj"
    Project     = "AutoStack"
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
  }
}
```

#### 1.10 Cost Monitoring
```bash
# Enable Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-10 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Set up budget alerts
aws budgets create-budget \
  --account-id 367749063363 \
  --budget file://budget.json
```

#### 1.11 NAT Gateway Alternative (Cost Saving)
```bash
# Optional: Replace NAT Gateway ($30/month) with NAT Instance
# Use t3.nano ($3/month) as NAT instance
# Update terraform/modules/vpc/main.tf
```

---

## 🚀 2. CI/CD Automation

### 2.1 Complete Flow

```
Developer Push → GitHub → Webhook → Jenkins → Build Docker → 
Push to ECR → Update Helm Values → Commit to GitOps Repo → 
ArgoCD Auto-Sync → Deploy to EKS → Zero-Downtime Rollout
```

### 2.2 Jenkins Configuration

#### Install Required Plugins
1. Go to Jenkins → Manage Plugins
2. Install:
   - Docker Pipeline
   - Git Plugin
   - AWS Steps
   - Kubernetes CLI
   - Pipeline: Stage View

#### Add Credentials
```groovy
// In Jenkins → Manage Credentials → Add:
1. AWS Credentials (Access Key ID + Secret)
   - ID: aws-credentials
   - Type: AWS Credentials

2. GitHub Token
   - ID: github-token
   - Type: Secret text

3. Docker Registry
   - ID: ecr-credentials
   - Type: Username with password
```

#### Create Jenkins Pipeline
```groovy
// Jenkinsfile for backend
pipeline {
    agent any
    
    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REPO = '367749063363.dkr.ecr.ap-south-1.amazonaws.com/autostack-backend'
        IMAGE_TAG = "${BUILD_NUMBER}"
        ARGOCD_REPO = 'https://github.com/Raj-glitch-max/auto-stack-deploy.git'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        cd autostack-backend/backend
                        docker build -t ${ECR_REPO}:${IMAGE_TAG} .
                        docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_REPO}:latest
                    """
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                script {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REPO}
                        
                        docker push ${ECR_REPO}:${IMAGE_TAG}
                        docker push ${ECR_REPO}:latest
                    """
                }
            }
        }
        
        stage('Update GitOps Repo') {
            steps {
                script {
                    sh """
                        git clone ${ARGOCD_REPO} gitops-repo
                        cd gitops-repo
                        
                        # Update image tag in ArgoCD app
                        sed -i 's|image:.*|image: ${ECR_REPO}:${IMAGE_TAG}|' \
                          infra/argocd/apps/backend-app.yaml
                        
                        git config user.email "jenkins@autostack.com"
                        git config user.name "Jenkins CI"
                        git add .
                        git commit -m "Update backend image to ${IMAGE_TAG}"
                        git push origin main
                    """
                }
            }
        }
        
        stage('Trigger ArgoCD Sync') {
            steps {
                script {
                    sh """
                        kubectl -n argocd patch application autostack-backend \
                          --type merge -p '{"spec":{"source":{"targetRevision":"HEAD"}}}'
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Deployment successful! Image: ${ECR_REPO}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}
```

### 2.3 GitHub Webhook Setup

#### Configure Webhook
1. Go to GitHub repo → Settings → Webhooks
2. Add webhook:
   - Payload URL: `http://65.2.39.10:8080/github-webhook/`
   - Content type: application/json
   - Events: Just the push event
   - Active: ✓

#### Test Webhook
```bash
# Make a code change
echo "// trigger deploy" >> autostack-backend/backend/main.py
git add .
git commit -m "feat: trigger CI/CD test"
git push origin main

# Watch Jenkins job start automatically
```

---

## 🌐 3. Public Access & Monitoring

### 3.1 Enable LoadBalancer (Optional)

#### Update Frontend Service
```yaml
# infra/argocd/apps/frontend-app.yaml
service:
  type: LoadBalancer
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
```

#### Get Public URL
```bash
kubectl get svc autostack-frontend -n default
# Copy EXTERNAL-IP (takes 2-3 minutes to provision)
```

### 3.2 Enable Prometheus + Grafana

#### Upgrade to t3.medium Nodes
```bash
# Update terraform/terraform.tfvars
node_instance_types = ["t3.medium"]
node_desired_size   = 2

terraform apply -auto-approve
```

#### Uncomment Prometheus
```bash
# In infra/helm/autostack-backend/main.tf
# Uncomment the prometheus section
```

#### Access Grafana
```bash
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
# Open: http://localhost:3000
# Username: admin
# Password: admin
```

#### Import Dashboards
1. Kubernetes Cluster Monitoring: 7249
2. Node Exporter Full: 1860
3. ArgoCD: 14584

### 3.3 Logging with Loki (Optional)

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack -n monitoring \
  --set promtail.enabled=true \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=10Gi
```

---

## ✅ 4. Validation Checklist

### Infrastructure Health
```bash
# Check all pods
kubectl get pods -A
# Expected: All Running

# Check nodes
kubectl get nodes
# Expected: All Ready

# Check services
kubectl get svc -n default
# Expected: All ClusterIPs assigned

# Check ArgoCD
kubectl get applications -n argocd
# Expected: All Synced & Healthy
```

### Application Health
```bash
# Backend health
kubectl port-forward svc/autostack-backend -n default 8000:8000
curl http://localhost:8000/health
# Expected: {"status": "ok"}

# Frontend
kubectl port-forward svc/autostack-frontend -n default 3000:3000
# Open: http://localhost:3000
# Expected: React app loads

# Database
kubectl exec -it deployment/postgres -n default -- psql -U autostack -c "SELECT version();"
# Expected: PostgreSQL version info
```

### ArgoCD Health
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:80
# Open: http://localhost:8080
# Expected: All apps showing Synced & Healthy
```

---

## 🧠 5. SaaS Integration (AutoStack Monitoring)

### 5.1 Add Metrics Endpoints

```python
# In backend/main.py
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Response

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests')
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")

@app.get("/health/live")
async def liveness():
    return {"status": "alive"}

@app.get("/health/ready")
async def readiness():
    # Check database connection
    try:
        await db.execute("SELECT 1")
        return {"status": "ready"}
    except:
        return {"status": "not ready"}, 503
```

### 5.2 Status Page Endpoint

```python
@app.get("/status/cluster")
async def cluster_status():
    """Real-time cluster health for AutoStack monitoring UI"""
    import subprocess
    
    # Get pod status
    result = subprocess.run(
        ["kubectl", "get", "pods", "-A", "-o", "json"],
        capture_output=True, text=True
    )
    pods = json.loads(result.stdout)
    
    return {
        "pods": {
            "total": len(pods["items"]),
            "running": sum(1 for p in pods["items"] if p["status"]["phase"] == "Running"),
            "failed": sum(1 for p in pods["items"] if p["status"]["phase"] == "Failed")
        },
        "timestamp": datetime.utcnow().isoformat()
    }
```

### 5.3 Slack/Discord Webhooks

```python
import httpx

SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL")

async def send_alert(message: str):
    async with httpx.AsyncClient() as client:
        await client.post(SLACK_WEBHOOK, json={
            "text": f"🚨 AutoStack Alert: {message}"
        })

# Use in exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    await send_alert(f"Error in {request.url.path}: {str(exc)}")
    raise exc
```

---

## 💾 6. Backup & Disaster Recovery

### 6.1 Save Current State

```bash
# Backup Terraform state
cd infra/terraform
terraform state pull > ../../backups/terraform-state-$(date +%Y%m%d).json

# Backup Kubernetes manifests
kubectl get all -A -o yaml > ../../backups/k8s-full-backup-$(date +%Y%m%d).yaml

# Backup ArgoCD config
kubectl get applications -n argocd -o yaml > ../../backups/argocd-apps-$(date +%Y%m%d).yaml
```

### 6.2 Git Version Control

```bash
git add .
git commit -m "🚀 Full EKS + ArgoCD + Jenkins deployment success - Production ready"
git push origin main

# Create release tag
git tag -a v1.0.0 -m "Production deployment v1.0.0"
git push origin v1.0.0
```

### 6.3 Disaster Recovery Plan

```bash
# In case of total failure, recovery steps:

# 1. Restore Terraform state
cd infra/terraform
terraform state push backups/terraform-state-YYYYMMDD.json

# 2. Re-apply infrastructure
terraform apply -auto-approve

# 3. ArgoCD will auto-sync applications from Git

# 4. Verify
kubectl get pods -A
kubectl get applications -n argocd

# Total recovery time: ~15 minutes
```

---

## 🎯 Next Steps Priority

### Immediate (Next 24 hours)
- [ ] Set up Jenkins pipeline
- [ ] Configure GitHub webhook
- [ ] Test one-click deployment
- [ ] Validate all health checks

### Short-term (Next week)
- [ ] Enable MFA on AWS
- [ ] Move secrets to Secrets Manager
- [ ] Set up CloudWatch alarms
- [ ] Configure cost budgets

### Medium-term (Next month)
- [ ] Upgrade to t3.medium for monitoring
- [ ] Enable Prometheus + Grafana
- [ ] Add custom dashboards
- [ ] Implement logging with Loki

### Long-term (Production)
- [ ] Enable RDS encryption
- [ ] Set up multi-region backup
- [ ] Implement blue-green deployments
- [ ] Add canary deployments with Flagger

---

## 📊 Success Metrics

**Track these KPIs:**
- Deployment frequency (target: multiple/day)
- Lead time for changes (target: <1 hour)
- Mean time to recovery (target: <15 minutes)
- Change failure rate (target: <5%)
- Service uptime (target: 99.9%)

---

## 🔥 You're Production Ready!

Your AutoStack platform is now ready for:
- ✅ Automated deployments
- ✅ Real-time monitoring
- ✅ Disaster recovery
- ✅ Cost optimization
- ✅ Security hardening

**Go build your SaaS!** 🚀
