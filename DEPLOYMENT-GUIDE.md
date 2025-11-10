# 🚀 AUTOSTACK DEPLOYMENT GUIDE

**Complete Guide to Deploy AutoStack to Production**

---

## 📊 CURRENT STATUS

**Verification Results:**
- ✅ S3 Bucket: EXISTS
- ✅ DynamoDB Table: EXISTS
- ❌ IAM Role: NOT FOUND (needs creation)
- ✅ Backend: HEALTHY
- ✅ Frontend: ACCESSIBLE

**Ready to Deploy:** 90% (1 item remaining)

---

## 🎯 QUICK START (5 Minutes)

### **Step 1: Create IAM Role**

```powershell
# Run the setup script
.\scripts\setup-aws-infrastructure.ps1

# This will create:
# - IAM role: AutoStackTerraformRole
# - Attach minimal policy
# - Output role ARN
```

### **Step 2: Update Terraform Config**

```powershell
# Edit infrastructure/terraform/backend.tf
# Replace YOUR_ROLE_ARN with the ARN from Step 1

variable "aws_assume_role_arn" {
  default = "arn:aws:iam::YOUR_ACCOUNT_ID:role/AutoStackTerraformRole"
}
```

### **Step 3: Initialize Terraform**

```powershell
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### **Step 4: Run Tests**

```powershell
# Run E2E tests
python tests/e2e/test_full_flow.py

# Expected output:
# 🎉 ALL TESTS PASSED!
```

### **Step 5: Deploy!**

```powershell
# Your app is now live!
# Check deployment URL in Terraform outputs
terraform output
```

---

## 📋 DETAILED DEPLOYMENT STEPS

### **Phase 1: AWS Infrastructure Setup (15 min)**

#### **1.1 Create IAM Role**

```bash
# Get your AWS account ID
aws sts get-caller-identity

# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
    },
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create role
aws iam create-role \
  --role-name AutoStackTerraformRole \
  --assume-role-policy-document file://trust-policy.json

# Get role ARN (SAVE THIS!)
aws iam get-role --role-name AutoStackTerraformRole --query 'Role.Arn'
```

#### **1.2 Attach IAM Policy**

```bash
# Create policy from docs/OPS-RUNBOOK.md
# Copy the minimal IAM policy to terraform-policy.json

# Attach policy
aws iam put-role-policy \
  --role-name AutoStackTerraformRole \
  --policy-name AutoStackMinimalPolicy \
  --policy-document file://terraform-policy.json
```

#### **1.3 Verify Setup**

```powershell
# Run verification
.\scripts\quick-verify.ps1

# Should show all PASS
```

---

### **Phase 2: Terraform Deployment (20 min)**

#### **2.1 Configure Backend**

```hcl
# Edit infrastructure/terraform/backend.tf

terraform {
  backend "s3" {
    bucket         = "autostack-tfstate"
    key            = "autostack/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "autostack-tf-locks"
    encrypt        = true
  }
}

variable "aws_assume_role_arn" {
  default = "arn:aws:iam::123456789012:role/AutoStackTerraformRole"  # YOUR ARN HERE
}
```

#### **2.2 Create terraform.tfvars**

```hcl
# infrastructure/terraform/terraform.tfvars

aws_region          = "us-east-1"
aws_assume_role_arn = "arn:aws:iam::123456789012:role/AutoStackTerraformRole"
environment         = "production"

# EKS Configuration
eks_cluster_name  = "autostack-cluster"
eks_node_count    = 3
eks_instance_type = "t3.medium"

# RDS Configuration
rds_instance_class     = "db.t3.micro"
rds_allocated_storage  = 20
rds_database_name      = "autostack"
rds_master_username    = "autostack_admin"
# rds_master_password will be prompted
```

#### **2.3 Initialize Terraform**

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Validate
terraform validate

# Plan
terraform plan -out=tfplan

# Review the plan carefully!
```

#### **2.4 Apply Infrastructure**

```bash
# Apply (with approval)
terraform apply tfplan

# Or auto-approve (use with caution!)
terraform apply -auto-approve

# Wait 10-15 minutes for EKS cluster creation
```

#### **2.5 Get Outputs**

```bash
# View all outputs
terraform output

# Expected outputs:
# - eks_cluster_endpoint
# - rds_endpoint
# - ecr_repository_url
# - load_balancer_dns
# - api_endpoint
```

---

### **Phase 3: Application Deployment (10 min)**

#### **3.1 Configure kubectl**

```bash
# Configure kubectl for EKS
aws eks update-kubeconfig \
  --name autostack-cluster \
  --region us-east-1

# Verify connection
kubectl get nodes
```

#### **3.2 Deploy Application**

```bash
# Build and push Docker image
docker build -t autostack-backend ./autostack-backend
docker tag autostack-backend:latest YOUR_ECR_URL/autostack-backend:latest
docker push YOUR_ECR_URL/autostack-backend:latest

# Apply Kubernetes manifests (if created)
kubectl apply -f infrastructure/k8s/

# Or use Terraform to deploy
# (if k8s resources are in Terraform)
```

#### **3.3 Verify Deployment**

```bash
# Check pods
kubectl get pods -n autostack

# Check services
kubectl get svc -n autostack

# Check ingress
kubectl get ingress -n autostack

# Test health endpoint
curl https://YOUR_API_ENDPOINT/health
```

---

### **Phase 4: Testing & Verification (15 min)**

#### **4.1 Run E2E Tests**

```powershell
# Update test config with production URL
# Edit tests/e2e/test_full_flow.py
# BASE_URL = "https://api.your-domain.com"

# Run tests
python tests/e2e/test_full_flow.py

# Expected: 🎉 ALL TESTS PASSED!
```

#### **4.2 Manual Testing**

```
1. Visit https://your-domain.com
2. Sign up with email/password
3. Login
4. Connect GitHub account
5. Create a project
6. Deploy a test app
7. Verify deployment succeeds
8. Test rollback
9. Check logs
10. Verify monitoring
```

#### **4.3 Security Verification**

```bash
# Test rate limiting
for i in {1..15}; do curl -X POST https://api.your-domain.com/login; done

# Test OAuth state
curl https://api.your-domain.com/auth/github | grep "state="

# Test HTTPS
curl -I https://your-domain.com | grep "HTTP/2 200"

# Test webhook signature
curl -X POST https://api.your-domain.com/webhooks/github \
  -H "X-Hub-Signature-256: invalid" \
  -d '{"action":"push"}'
```

---

### **Phase 5: Monitoring Setup (10 min)**

#### **5.1 Configure Prometheus**

```bash
# Install Prometheus (if not in Terraform)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Verify
kubectl get pods -n monitoring
```

#### **5.2 Configure Grafana**

```bash
# Get Grafana password
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Visit http://localhost:3000
# Login: admin / <password from above>
```

#### **5.3 Configure Alerts**

```yaml
# Create alert rules
# infrastructure/k8s/prometheus-alerts.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
data:
  alerts.yml: |
    groups:
    - name: autostack
      rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        annotations:
          summary: "High error rate detected"
      - alert: DeploymentFailed
        expr: deployment_status{status="failed"} > 0
        annotations:
          summary: "Deployment failed"
```

---

## 🔐 SECURITY CHECKLIST

Before going live, verify:

- [ ] No root AWS credentials used
- [ ] IAM policy is minimal
- [ ] S3 bucket is not public
- [ ] RDS is not publicly accessible
- [ ] Security groups are restrictive
- [ ] No secrets in git
- [ ] HTTPS enabled with valid certificate
- [ ] OAuth scopes are minimal
- [ ] Rate limiting enabled
- [ ] Account lockout enabled
- [ ] Webhook signatures verified
- [ ] Docker images scanned
- [ ] Dependencies audited

---

## 📊 MONITORING CHECKLIST

Ensure monitoring is working:

- [ ] Prometheus metrics available
- [ ] Grafana dashboards configured
- [ ] Alerts configured and tested
- [ ] Logs centralized (CloudWatch/ELK)
- [ ] Error tracking enabled (Sentry)
- [ ] Uptime monitoring enabled
- [ ] RDS backups automated
- [ ] S3 state versioning enabled

---

## 💰 COST ESTIMATE

**Monthly AWS Costs (us-east-1):**

| Service | Configuration | Cost |
|---------|--------------|------|
| EKS Cluster | 1 cluster | $73 |
| EC2 Nodes | 3x t3.medium | $90 |
| RDS | db.t3.micro | $15 |
| Load Balancer | ALB | $20 |
| S3 | 10GB | $0.23 |
| DynamoDB | On-demand | $0.25 |
| CloudWatch | Basic | $5 |
| Data Transfer | 100GB | $9 |
| **Total** | | **~$212/month** |

**Free Tier Eligible:**
- RDS: 750 hours/month (first year)
- EC2: 750 hours/month (first year)
- S3: 5GB storage
- DynamoDB: 25GB storage

**Cost Optimization:**
- Use Spot instances for non-critical workloads
- Enable auto-scaling (scale down during off-hours)
- Use S3 lifecycle policies
- Set up AWS Budgets with alerts

---

## 🚨 TROUBLESHOOTING

### **Terraform apply fails**

```bash
# Check state lock
aws dynamodb scan --table-name autostack-tf-locks

# Force unlock if needed
terraform force-unlock LOCK_ID

# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:role/AutoStackTerraformRole \
  --action-names eks:CreateCluster
```

### **EKS cluster not accessible**

```bash
# Update kubeconfig
aws eks update-kubeconfig --name autostack-cluster

# Check cluster status
aws eks describe-cluster --name autostack-cluster

# Check node status
kubectl get nodes
```

### **Application not responding**

```bash
# Check pods
kubectl get pods -n autostack

# Check logs
kubectl logs -n autostack deployment/autostack-backend

# Check service
kubectl describe svc -n autostack autostack-backend
```

### **Database connection fails**

```bash
# Check RDS status
aws rds describe-db-instances

# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test connection from pod
kubectl run -it --rm debug --image=postgres:15 -- \
  psql -h RDS_ENDPOINT -U autostack_admin -d autostack
```

---

## 📚 DOCUMENTATION

- **Terraform Setup:** `infrastructure/terraform/SETUP.md`
- **Operations Guide:** `docs/OPS-RUNBOOK.md`
- **Production Checklist:** `docs/PRODUCTION-READINESS.md`
- **Acceptance Tests:** `docs/ACCEPTANCE-TESTS.md`
- **Final Summary:** `docs/FINAL-SUMMARY.md`

---

## 🎉 SUCCESS CRITERIA

**Platform is LIVE when:**

1. ✅ Terraform apply completes successfully
2. ✅ EKS cluster is running
3. ✅ Application pods are healthy
4. ✅ Load balancer is accessible
5. ✅ E2E tests pass
6. ✅ Manual testing succeeds
7. ✅ Monitoring is working
8. ✅ External user can deploy an app

---

## 🚀 GO LIVE!

Once all checks pass:

1. Update DNS to point to load balancer
2. Verify SSL certificate
3. Announce to users
4. Monitor closely for first 24 hours
5. Celebrate! 🎉

---

*Last Updated: November 10, 2025*
*AutoStack v1.0 - Production Ready*
