# AutoStack Cloud Infrastructure

Complete AWS cloud infrastructure for AutoStack with EKS, Jenkins, ArgoCD, and production-grade monitoring.

## 📁 Directory Structure

```
infra/
├── terraform/              # Terraform infrastructure as code
│   ├── main.tf            # Main configuration
│   ├── variables.tf       # Input variables
│   ├── outputs.tf         # Output values
│   ├── Makefile          # Convenience commands
│   ├── terraform.tfvars.example
│   └── modules/          # Terraform modules
│       ├── vpc/          # VPC, subnets, NAT
│       ├── eks/          # EKS cluster
│       ├── ecr/          # Container registries
│       ├── rds/          # PostgreSQL database
│       ├── secrets/      # SSM Parameter Store
│       ├── jenkins/      # Jenkins EC2/EKS
│       ├── k8s-addons/   # Kubernetes controllers
│       └── monitoring/   # CloudWatch alarms
│
├── helm/                  # Helm charts
│   ├── autostack-frontend/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   └── autostack-backend/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│
├── argocd/               # ArgoCD applications
│   └── apps/
│       ├── root.yaml     # App-of-Apps
│       ├── autostack-frontend.yaml
│       └── autostack-backend.yaml
│
└── jenkins/              # Jenkins configuration
    └── jobs/             # Job definitions
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with credentials
- Terraform >= 1.5.0
- kubectl
- helm >= 3.0

### Deploy Infrastructure

```bash
# 1. Configure variables
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars

# 2. Initialize and apply
make tf-init
make tf-plan
make tf-apply

# 3. Configure kubectl
make kubeconfig

# 4. Deploy applications
kubectl apply -f ../argocd/apps/root.yaml
```

## 🎯 What Gets Created

### AWS Resources

- **VPC**: Multi-AZ with public/private subnets
- **EKS**: Managed Kubernetes cluster (v1.28)
- **ECR**: Container registries for frontend/backend
- **RDS**: PostgreSQL database (optional)
- **SSM**: Parameter Store for secrets
- **ALB**: Application Load Balancer
- **CloudWatch**: Alarms and monitoring
- **Jenkins**: CI/CD server (EC2 or EKS)

### Kubernetes Resources

- **ArgoCD**: GitOps deployment tool
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **AWS Load Balancer Controller**: ALB integration
- **Cluster Autoscaler**: Node scaling
- **Metrics Server**: Resource metrics
- **KEDA**: Event-driven autoscaling (optional)

### Applications

- **Frontend**: Next.js app with HPA
- **Backend**: FastAPI app with HPA
- **Database**: PostgreSQL (in-cluster or RDS)

## 🔧 Configuration

All features are toggleable via `terraform.tfvars`:

```hcl
# Cost optimization
use_spot_instances = true    # Use spot instances
node_min_size = 1           # Minimum nodes
node_max_size = 4           # Maximum nodes

# Database
use_rds = false             # Use RDS instead of in-cluster
use_aurora = false          # Use Aurora Serverless v2

# Jenkins
jenkins_on_eks = false      # Run Jenkins on EKS vs EC2

# Optional add-ons
enable_nginx_ingress = false
enable_external_dns = false
enable_cert_manager = false
enable_loki = false
enable_keda = true
```

## 📊 Architecture

```
Internet → ALB → EKS Cluster
                  ├── Frontend Pods (HPA)
                  ├── Backend Pods (HPA)
                  ├── ArgoCD
                  ├── Prometheus
                  └── Grafana

ECR ← Jenkins → GitHub → ArgoCD → EKS
```

## 🔐 Security

- **IRSA**: IAM Roles for Service Accounts
- **Private Subnets**: Workloads run in private subnets
- **Security Groups**: Least privilege access
- **Secrets**: Stored in SSM Parameter Store
- **Non-root Containers**: All pods run as non-root
- **Pod Security Context**: Security policies enforced

## 💰 Cost Estimation

Default configuration (~$200/month):
- EKS Control Plane: $73/month
- EC2 Spot Nodes (2x t3.medium): $30/month
- NAT Gateways (2): $65/month
- ALB: $20/month
- Data Transfer: $10/month

## 📝 Common Commands

```bash
# Terraform
make tf-init      # Initialize Terraform
make tf-plan      # Plan changes
make tf-apply     # Apply changes
make tf-destroy   # Destroy infrastructure

# Kubernetes
kubectl get nodes
kubectl get pods -n autostack
kubectl get hpa -n autostack
kubectl logs -f <pod-name> -n autostack

# ArgoCD
kubectl get applications -n argocd
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d

# Monitoring
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

## 🛠️ Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n autostack
kubectl logs <pod-name> -n autostack
```

### ArgoCD not syncing
```bash
kubectl logs -n argocd deployment/argocd-application-controller
argocd app sync autostack-frontend --force
```

### Check ALB
```bash
kubectl describe ingress -n autostack
kubectl get targetgroupbindings -n autostack
```

## 📚 Documentation

- [Terraform Modules](terraform/modules/)
- [Helm Charts](helm/)
- [ArgoCD Apps](argocd/apps/)
- [Main Documentation](../FIXES_AND_UPDATES.md#eks--jenkins--argocd-cloud-deploy)

## ✅ Verification

After deployment, verify:

- [ ] `terraform apply` completes successfully
- [ ] EKS nodes are ready
- [ ] ArgoCD UI is accessible
- [ ] Applications are deployed and healthy
- [ ] ALB routes traffic correctly
- [ ] Monitoring dashboards show data
- [ ] HPA is configured
- [ ] Jenkins pipeline runs successfully

## 🔄 CI/CD Flow

1. Developer pushes code to GitHub
2. Jenkins builds Docker images
3. Jenkins pushes to ECR
4. Jenkins updates Helm values in Git
5. ArgoCD detects change
6. ArgoCD syncs to EKS
7. Kubernetes rolls out new pods
8. Health checks pass
9. ALB routes traffic

## 🎯 Next Steps

1. Update OAuth callbacks with ALB DNS
2. Configure domain name (optional)
3. Enable RDS for production
4. Set up monitoring alerts
5. Configure Jenkins credentials
6. Test autoscaling
7. Run security audit

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review logs: `kubectl logs`
3. Check ArgoCD UI
4. Review Jenkins console output
5. Consult main documentation

---

**Status**: Production-ready infrastructure code. Deploy with `make tf-apply`.
