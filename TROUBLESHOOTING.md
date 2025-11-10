# 🔧 Troubleshooting Guide

Complete guide covering all issues encountered and resolved during AutoStack development and deployment.

---

## 📋 Table of Contents

1. [Infrastructure Issues](#infrastructure-issues)
2. [Kubernetes Issues](#kubernetes-issues)
3. [Application Issues](#application-issues)
4. [CI/CD Issues](#cicd-issues)
5. [Network & Load Balancer Issues](#network--load-balancer-issues)
6. [Database Issues](#database-issues)

---

## ☁️ Infrastructure Issues

### **Issue 1: Terraform Variable Name Mismatch**

**Error:**
```
Error: Unsupported argument
on modules/eks/main.tf line 12:
cluster_version = var.cluster_version
An argument named "cluster_version" is not expected here.
```

**Cause:** Variable defined as `eks_cluster_version` but used as `cluster_version`

**Fix:**
```hcl
# modules/eks/variables.tf
variable "eks_cluster_version" {  # Correct name
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

# modules/eks/main.tf
cluster_version = var.eks_cluster_version  # Use correct variable
```

---

### **Issue 2: EKS Launch Template user_data Error**

**Error:**
```
Error: Unsupported argument
user_data must be a string, not a list
```

**Cause:** AWS provider update changed `user_data` format requirements

**Fix:**
```hcl
# Remove user_data from launch template
# EKS automatically injects bootstrap script
resource "aws_launch_template" "eks_nodes" {
  # Remove: user_data = [...]
  # EKS handles this automatically
}
```

---

### **Issue 3: Duplicate SSM Parameters**

**Error:**
```
Error: creating SSM Parameter: ParameterAlreadyExists
```

**Cause:** Multiple `aws_ssm_parameter` resources with same name

**Fix:**
```hcl
# Remove duplicate resources in modules/secrets/main.tf
# Keep only one definition per parameter
resource "aws_ssm_parameter" "database_url" {
  name  = "/autostack/prod/database-url"
  type  = "SecureString"
  value = var.database_url
}
```

---

### **Issue 4: Kubernetes Provider Circular Dependency**

**Error:**
```
Error: Cycle: kubernetes provider depends on EKS, EKS depends on kubernetes
```

**Cause:** Provider trying to use cluster before it exists

**Fix:**
```hcl
# Use depends_on to ensure correct order
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

# In modules using kubernetes provider
resource "kubernetes_namespace" "example" {
  depends_on = [module.eks]  # Explicit dependency
}
```

---

## ☸️ Kubernetes Issues

### **Issue 5: Helm Webhook Timing Issues**

**Error:**
```
Error: timed out waiting for the condition
Webhook readiness probe failed
```

**Cause:** Helm trying to deploy before webhook is ready

**Fix:**
```bash
# Add delays between deployments
resource "time_sleep" "wait_for_eks" {
  depends_on = [module.eks]
  create_duration = "30s"
}

# Or manually:
sleep 60
helm install ...
```

---

### **Issue 6: Prometheus Webhook Conflicts**

**Error:**
```
Error: admission webhook "validate.prometheus.io" denied the request
```

**Cause:** Multiple Prometheus installations or webhook not ready

**Fix:**
```bash
# Delete conflicting webhooks
kubectl delete validatingwebhookconfigurations.admissionregistration.k8s.io \
  prometheus-operator-admission

# Reinstall Prometheus
helm uninstall prometheus -n monitoring
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

---

### **Issue 7: Terraform State Locks**

**Error:**
```
Error: Error acquiring the state lock
Lock Info: ID: xxx, Operation: OperationTypeApply
```

**Cause:** Previous Terraform run didn't complete cleanly

**Fix:**
```bash
# Force unlock (use carefully!)
terraform force-unlock <LOCK_ID>

# Or delete lock in DynamoDB
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"<LOCK_ID>"}}'
```

---

### **Issue 8: Helm Release Locks**

**Error:**
```
Error: another operation (install/upgrade/rollback) is in progress
```

**Cause:** Previous Helm operation didn't complete

**Fix:**
```bash
# Check pending operations
helm list --pending -A

# Rollback or delete
helm rollback <release> -n <namespace>
# or
helm delete <release> -n <namespace>
```

---

## 🔐 IAM & Permissions Issues

### **Issue 9: ALB Controller Missing Permissions**

**Error:**
```
AccessDenied: User is not authorized to perform: elasticloadbalancing:AddTags
```

**Cause:** AWS Load Balancer Controller IAM role missing permissions

**Fix:**
```bash
# Create policy with required permissions
cat > alb-permissions.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "elasticloadbalancing:AddTags",
      "elasticloadbalancing:RemoveTags",
      "elasticloadbalancing:CreateLoadBalancer",
      "elasticloadbalancing:CreateTargetGroup",
      "elasticloadbalancing:DeleteLoadBalancer",
      "elasticloadbalancing:DeleteTargetGroup",
      "elasticloadbalancing:ModifyLoadBalancerAttributes",
      "elasticloadbalancing:ModifyTargetGroup",
      "elasticloadbalancing:RegisterTargets",
      "elasticloadbalancing:DeregisterTargets"
    ],
    "Resource": "*"
  }]
}
EOF

# Create and attach policy
aws iam create-policy \
  --policy-name ALBControllerAdditionalPermissions \
  --policy-document file://alb-permissions.json

aws iam attach-role-policy \
  --role-name autostack-prod-alb-controller \
  --policy-arn arn:aws:iam::367749063363:policy/ALBControllerAdditionalPermissions

# Restart controller
kubectl rollout restart deployment aws-load-balancer-controller -n kube-system
```

---

### **Issue 10: ECR Pull Permissions**

**Error:**
```
Failed to pull image: unauthorized: authentication required
```

**Cause:** EKS nodes can't pull from ECR

**Fix:**
```hcl
# Add ECR permissions to node IAM role
resource "aws_iam_role_policy_attachment" "eks_ecr_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
```

---

## 🐳 Docker & Container Issues

### **Issue 11: Frontend Docker Build - npm Peer Dependencies**

**Error:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! peer react@"^18.0.0" from next@15.0.0
```

**Cause:** React version conflicts between Next.js 15 and other packages

**Fix:**
```dockerfile
# In Dockerfile, add --legacy-peer-deps flag
RUN npm ci --only=production --ignore-scripts --legacy-peer-deps

# And in builder stage
RUN npm ci --ignore-scripts --legacy-peer-deps
```

---

### **Issue 12: Backend Docker Build - Incorrect COPY Paths**

**Error:**
```
COPY failed: file not found in build context: backend/alembic.ini
```

**Cause:** Build context set to `backend/` directory, but COPY used `backend/` prefix

**Fix:**
```dockerfile
# Before (incorrect):
COPY backend/alembic.ini .
COPY backend/app/ ./app/

# After (correct):
COPY alembic.ini .
COPY app/ ./app/

# Build command sets context correctly:
docker build -f backend/Dockerfile backend/
```

---

### **Issue 13: Docker Client in Container**

**Error:**
```
docker.errors.DockerException: Error while fetching server API version
```

**Cause:** Backend trying to use Docker client inside Kubernetes pod (no Docker socket)

**Fix:**
```python
# Make Docker client optional in deploy_engine.py
def __init__(self):
    try:
        self.docker_client = docker.from_env()
        logger.info("Docker client initialized successfully")
    except (DockerException, Exception) as e:
        logger.warning(f"Docker client not available: {e}")
        self.docker_client = None

# Check before using
def build_and_deploy(self, ...):
    if not self.docker_client:
        return False, {}, "Docker not available in this environment"
    # ... rest of logic
```

---

## 🗄️ Database Issues

### **Issue 14: PostgreSQL Pod Pending - Resource Constraints**

**Error:**
```
0/3 nodes are available: 3 Insufficient memory
```

**Cause:** PostgreSQL requesting too much memory for t3.small nodes

**Fix:**
```yaml
# Reduce resource requests in postgres-deployment.yaml
resources:
  requests:
    memory: "128Mi"  # Was 256Mi
    cpu: "100m"      # Was 200m
  limits:
    memory: "256Mi"  # Was 512Mi
    cpu: "200m"      # Was 500m
```

---

### **Issue 15: PersistentVolumeClaim Pending**

**Error:**
```
waiting for a volume to be created
StorageClass not found
```

**Cause:** EBS CSI driver not installed or PVC not needed

**Fix:**
```yaml
# Use emptyDir instead of PVC for development
volumes:
  - name: postgres-storage
    emptyDir: {}  # Instead of persistentVolumeClaim

# For production, install EBS CSI driver:
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.25"
```

---

### **Issue 16: SQLAlchemy Async Driver Error**

**Error:**
```
sqlalchemy.exc.InvalidRequestError: The asyncio extension requires an async driver.
The loaded 'psycopg2' is not async.
```

**Cause:** Using synchronous `psycopg2` driver with async SQLAlchemy

**Fix:**
```python
# Update DATABASE_URL to use asyncpg
# Before:
DATABASE_URL = "postgresql://user:pass@host:5432/db"

# After:
DATABASE_URL = "postgresql+asyncpg://user:pass@host:5432/db"

# Update requirements.txt
# Remove: psycopg2-binary
# Add: asyncpg
```

---

### **Issue 17: Alembic Multiple Head Revisions**

**Error:**
```
alembic.util.exc.CommandError: Multiple head revisions are present
for given argument 'head'; please specify a specific target revision
```

**Cause:** Two migration files with same revision prefix `002`

**Fix:**
```bash
# Rename conflicting migration
mv alembic/versions/002_fix_refresh_tokens.py \
   alembic/versions/003_fix_refresh_tokens.py

# Update inside file:
revision = '003_fix_tokens'      # Was 002_fix_tokens
down_revision = '002_github_oauth'  # Chain after previous
```

---

## 🌐 Network & Load Balancer Issues

### **Issue 18: LoadBalancer Stuck in Pending**

**Error:**
```
EXTERNAL-IP: <pending> (never gets assigned)
```

**Cause:** Multiple possible causes

**Fix:**
```bash
# 1. Check ALB controller logs
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# 2. Check service events
kubectl describe svc <service-name> -n default

# 3. Verify IAM permissions (see Issue #9)

# 4. Check security groups allow traffic

# 5. Simplify service annotations
# Remove complex annotations, use basic LoadBalancer:
spec:
  type: LoadBalancer
  # Remove all annotations initially
```

---

### **Issue 19: Service ClusterIP Not LoadBalancer**

**Error:**
ArgoCD keeps reverting service type back to ClusterIP

**Cause:** ArgoCD managing service, need to update GitOps repo

**Fix:**
```yaml
# Update infra/argocd/apps/frontend-app.yaml
service:
  type: LoadBalancer  # Change from ClusterIP
  port: 3000

# Commit and push
git add infra/argocd/apps/
git commit -m "fix: change service type to LoadBalancer"
git push origin main

# Force ArgoCD sync
kubectl -n argocd patch application autostack-frontend \
  --type merge -p '{"operation":{"sync":{"revision":"HEAD"}}}'
```

---

## 🚀 Application Issues

### **Issue 20: Backend Pod CrashLoopBackOff - Missing Secrets**

**Error:**
```
Error: secret "autostack-secrets" not found
```

**Cause:** Secret not created in cluster

**Fix:**
```bash
# Create required secrets
kubectl create secret generic autostack-secrets \
  --from-literal=jwt-secret=your-secret-key \
  --from-literal=database-password=your-db-pass \
  -n default

# Create configmap
kubectl create configmap autostack-config \
  --from-literal=database-host=postgres \
  --from-literal=database-name=autostack \
  -n default
```

---

### **Issue 21: Frontend Environment Variables Not Set**

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'API_URL')
```

**Cause:** Environment variables not passed to Next.js build

**Fix:**
```yaml
# In ArgoCD app or Helm values
env:
  - name: NEXT_PUBLIC_API_URL
    value: "http://autostack-backend:8000"
  - name: NODE_ENV
    value: "production"

# Variables must be prefixed with NEXT_PUBLIC_ to be available in browser
```

---

## 🔄 ArgoCD Issues

### **Issue 22: ArgoCD Application OutOfSync**

**Error:**
```
Sync Status: OutOfSync
Health Status: Degraded
```

**Cause:** Git repository state doesn't match cluster state

**Fix:**
```bash
# Check what's different
kubectl describe application <app-name> -n argocd

# Force hard refresh
kubectl -n argocd patch application <app-name> \
  --type merge \
  --patch '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'

# Force sync
kubectl -n argocd patch application <app-name> \
  --type merge \
  --patch '{"operation":{"sync":{"revision":"HEAD"}}}'

# Or delete and recreate
kubectl delete application <app-name> -n argocd
kubectl apply -f infra/argocd/apps/<app-name>.yaml
```

---

### **Issue 23: ArgoCD Won't Auto-Sync**

**Error:**
Application stuck in manual sync mode

**Cause:** AutoSync policy not configured

**Fix:**
```yaml
# In ArgoCD application manifest
spec:
  syncPolicy:
    automated:
      prune: true        # Delete resources not in Git
      selfHeal: true     # Auto-sync when drift detected
      allowEmpty: false  # Don't sync if no resources
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 3
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 1m
```

---

## 🤖 CI/CD Issues

### **Issue 24: Jenkins Build Failing - AWS Credentials**

**Error:**
```
Error: Unable to locate credentials
```

**Cause:** AWS credentials not configured in Jenkins

**Fix:**
1. Go to Jenkins → Manage Jenkins → Manage Credentials
2. Add AWS Credentials with ID `aws-credentials`
3. Ensure Jenkinsfile uses correct ID:
```groovy
withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', 
                  credentialsId: 'aws-credentials']]) {
  // AWS commands here
}
```

---

### **Issue 25: GitHub Webhook Not Triggering**

**Error:**
Jenkins builds don't start automatically on git push

**Cause:** Webhook not configured or URL incorrect

**Fix:**
```bash
# Check webhook deliveries in GitHub
# Repo → Settings → Webhooks → Click webhook → Recent Deliveries

# Common issues:
# 1. URL must end with /github-webhook/ (with trailing slash)
# 2. Content-type must be application/json
# 3. Jenkins must be publicly accessible or use ngrok

# Test manually
curl -X POST http://<jenkins-url>:8080/github-webhook/
```

---

### **Issue 26: Jenkins Build - kubectl Not Found**

**Error:**
```
kubectl: command not found
```

**Cause:** kubectl not installed on Jenkins agent

**Fix:**
```bash
# SSH to Jenkins EC2
ssh -i key.pem ec2-user@<jenkins-ip>

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Configure kubeconfig
aws eks update-kubeconfig --name autostack-prod-eks --region ap-south-1

# Verify
kubectl get nodes
```

---

## 🎯 Quick Diagnosis Commands

### **Check Everything**
```bash
# Cluster health
kubectl get nodes
kubectl get pods -A
kubectl top nodes

# Application status
kubectl get all -n default
kubectl get applications -n argocd

# Logs
kubectl logs -f deployment/autostack-backend -n default
kubectl logs -f deployment/autostack-frontend -n default

# Events (recent issues)
kubectl get events -n default --sort-by='.lastTimestamp'

# Describe (detailed info)
kubectl describe pod <pod-name> -n default
```

### **Resource Issues**
```bash
# Check resource usage
kubectl top pods -n default
kubectl describe node <node-name>

# Check resource quotas
kubectl describe resourcequota -n default
```

### **Network Issues**
```bash
# Test connectivity between pods
kubectl exec -it <backend-pod> -n default -- curl http://postgres:5432

# Test external connectivity
kubectl exec -it <backend-pod> -n default -- curl https://google.com

# Check DNS
kubectl exec -it <backend-pod> -n default -- nslookup postgres
```

---

## 📚 Additional Resources

- [Kubernetes Troubleshooting Guide](https://kubernetes.io/docs/tasks/debug/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [ArgoCD Troubleshooting](https://argo-cd.readthedocs.io/en/stable/user-guide/troubleshooting/)
- [Terraform Debugging](https://developer.hashicorp.com/terraform/internals/debugging)

---

## 🆘 Getting Help

If you encounter an issue not covered here:

1. **Check logs**: `kubectl logs` and `kubectl describe`
2. **Check events**: `kubectl get events`
3. **Search GitHub Issues**: Check repo issues for similar problems
4. **Community Support**: Ask in Kubernetes/ArgoCD Slack

---

**This guide documents 26 real issues encountered and solved during AutoStack development. Keep it updated as you encounter new issues!**
