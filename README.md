# 🚀 AutoStack - Cloud-Native DevOps Platform

**Production-ready deployment platform built on AWS EKS with complete CI/CD automation.**

[![AWS](https://img.shields.io/badge/AWS-EKS-orange)](https://aws.amazon.com/eks/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28-blue)](https://kubernetes.io/)
[![ArgoCD](https://img.shields.io/badge/ArgoCD-GitOps-green)](https://argo-cd.readthedocs.io/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-purple)](https://www.terraform.io/)

---

## 📋 Overview

AutoStack is an enterprise-grade deployment platform that combines modern DevOps practices with cloud-native technologies. Deploy React frontends and FastAPI backends with zero-downtime rolling updates, automatic scaling, and full observability.

### **Live Production URLs**
```
Frontend: http://k8s-default-autostac-18fa0b5381-e5c307af56b74821.elb.ap-south-1.amazonaws.com
Backend:  http://k8s-default-autostac-1121a3f904-b22168c9296faf81.elb.ap-south-1.amazonaws.com
API Docs: http://k8s-default-autostac-1121a3f904-b22168c9296faf81.elb.ap-south-1.amazonaws.com/docs
```

---

## ✨ Features

### **Infrastructure**
- ☁️ **AWS EKS** - Managed Kubernetes cluster (v1.28)
- 🌐 **Load Balancing** - AWS Classic ELB for public access
- 📈 **Auto-scaling** - Cluster Autoscaler + HPA
- 🔐 **Secure** - IAM roles, VPC isolation, encrypted storage

### **Applications**
- ⚛️ **React Frontend** - Modern UI with Next.js
- 🐍 **FastAPI Backend** - Async Python API
- 🗄️ **PostgreSQL** - Persistent database
- 🔄 **GitOps** - ArgoCD for declarative deployments

### **CI/CD**
- 🤖 **Jenkins** - Automated build pipelines
- 🐳 **Docker** - Containerized applications
- 📦 **ECR** - AWS container registry
- 🚀 **One-click Deploy** - Git push triggers deployment

### **Observability**
- 📊 **Metrics Server** - Resource monitoring
- 🔍 **CloudWatch** - Centralized logging
- 📈 **Prometheus** (Ready) - Metrics collection
- 📉 **Grafana** (Ready) - Visual dashboards

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Internet                      │
└────────────┬────────────────────────────────────┘
             │
       ┌─────▼─────┐
       │   AWS ELB │ (Load Balancers)
       └─────┬─────┘
             │
    ┌────────▼────────┐
    │   EKS Cluster   │
    │   (Kubernetes)  │
    ├─────────────────┤
    │ ┌─────────────┐ │
    │ │  Frontend   │ │ (React/Next.js)
    │ │  Pods (1-3) │ │
    │ └──────┬──────┘ │
    │        │        │
    │ ┌──────▼──────┐ │
    │ │  Backend    │ │ (FastAPI)
    │ │  Pods (1-3) │ │
    │ └──────┬──────┘ │
    │        │        │
    │ ┌──────▼──────┐ │
    │ │ PostgreSQL  │ │
    │ │  Pod (1)    │ │
    │ └─────────────┘ │
    └─────────────────┘
            │
    ┌───────▼────────┐
    │    ArgoCD      │ ← GitOps sync from GitHub
    └────────────────┘
            │
    ┌───────▼────────┐
    │    Jenkins     │ ← CI/CD automation
    └────────────────┘
```

---

## 🚀 Quick Start

### **Prerequisites**
- AWS CLI configured with credentials
- kubectl installed
- Terraform v1.5+
- Helm v3+
- Docker

### **Deploy Infrastructure**

```bash
# Clone repository
git clone https://github.com/Raj-glitch-max/auto-stack-deploy.git
cd auto-stack-deploy

# Deploy infrastructure with Terraform
cd infra/terraform
terraform init
terraform plan
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --name autostack-prod-eks --region ap-south-1

# Verify cluster
kubectl get nodes
```

### **Deploy Applications**

Applications are automatically deployed via ArgoCD from GitHub:

```bash
# Check ArgoCD applications
kubectl get applications -n argocd

# Check pods
kubectl get pods -n default

# Check services
kubectl get svc -n default
```

### **Access Applications**

```bash
# Get public URLs
kubectl get svc -n default

# Frontend and Backend will show EXTERNAL-IP (AWS Load Balancer DNS)
# Access via browser or curl
```

---

## 📦 Project Structure

```
auto-stack-deploy/
├── autostack-frontend/          # React/Next.js application
│   ├── src/                     # Source code
│   ├── public/                  # Static assets
│   ├── Dockerfile               # Container image definition
│   └── package.json             # Dependencies
│
├── autostack-backend/           # FastAPI application
│   ├── backend/
│   │   ├── main.py              # API entry point
│   │   ├── models.py            # Database models
│   │   ├── auth.py              # Authentication logic
│   │   ├── deploy_engine.py    # Deployment engine
│   │   ├── alembic/             # Database migrations
│   │   └── Dockerfile           # Container image
│   └── requirements.txt         # Python dependencies
│
├── infra/                       # Infrastructure as Code
│   ├── terraform/               # AWS infrastructure
│   │   ├── main.tf              # Main configuration
│   │   ├── modules/             # Reusable modules
│   │   └── terraform.tfvars     # Variables
│   │
│   ├── helm/                    # Kubernetes applications
│   │   ├── autostack-frontend/  # Frontend Helm chart
│   │   └── autostack-backend/   # Backend Helm chart
│   │
│   └── argocd/                  # GitOps configuration
│       └── apps/                # ArgoCD application manifests
│
├── Jenkinsfile.backend          # Backend CI/CD pipeline
├── Jenkinsfile.frontend         # Frontend CI/CD pipeline
│
└── docs/                        # Documentation
    ├── BUILDING.md              # Build instructions
    ├── DEPLOYMENT.md            # Deployment guide
    ├── TROUBLESHOOTING.md       # Issues and fixes
    └── ARCHITECTURE.md          # System architecture
```

---

## 🔧 Development

### **Build Locally**

See [BUILDING.md](./BUILDING.md) for detailed build instructions.

```bash
# Build Docker images
docker build -t autostack-frontend ./autostack-frontend
docker build -t autostack-backend ./autostack-backend/backend

# Run locally
docker-compose up -d
```

### **Deploy to Production**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

```bash
# Automatic deployment via Git push
git add .
git commit -m "feat: new feature"
git push origin main

# Jenkins builds → ECR push → ArgoCD sync → EKS deployment
```

---

## 🐛 Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

**Common issues:**
- LoadBalancer stuck in "Pending" → Check IAM permissions
- Pods CrashLoopBackOff → Check logs with `kubectl logs`
- ArgoCD OutOfSync → Check GitHub repo and refresh app

---

## 💰 Cost Breakdown

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| EKS Control Plane | 1 cluster | $73.00 |
| EC2 Nodes | 3x t3.small spot | $13.50 |
| Jenkins EC2 | 1x t3.micro | $7.50 |
| RDS PostgreSQL | 1x db.t3.micro | $12.50 |
| Load Balancers | 2x Classic ELB | $36.00 |
| EBS + Other | Storage, logs | $20.00 |
| **Total** | | **~$162/month** |

*Cost-optimized for production workloads*

---

## 📊 Tech Stack

### **Frontend**
- React 18
- Next.js 15
- TypeScript
- TailwindCSS
- Lucide Icons

### **Backend**
- FastAPI (Python 3.11)
- SQLAlchemy (async)
- Alembic (migrations)
- PostgreSQL 15
- JWT Authentication

### **Infrastructure**
- AWS EKS (Kubernetes 1.28)
- Terraform (IaC)
- Helm Charts
- ArgoCD (GitOps)
- Jenkins (CI/CD)

### **DevOps Tools**
- Docker
- AWS ECR
- AWS Load Balancer Controller
- Cluster Autoscaler
- Metrics Server

---

## 📈 Metrics

- **Deployment Time**: 5 minutes (git push to production)
- **Uptime**: 99.9% target
- **Auto-scaling**: 1-3 pods per service
- **Zero-downtime**: Rolling updates
- **Build Success Rate**: 95%+

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

Built with:
- [Kubernetes](https://kubernetes.io/)
- [ArgoCD](https://argo-cd.readthedocs.io/)
- [Terraform](https://www.terraform.io/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)

---

## 📞 Support

- **Documentation**: See `docs/` folder
- **Issues**: [GitHub Issues](https://github.com/Raj-glitch-max/auto-stack-deploy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Raj-glitch-max/auto-stack-deploy/discussions)

---

## 🎯 Roadmap

- [x] AWS EKS deployment
- [x] GitOps with ArgoCD
- [x] CI/CD with Jenkins
- [x] Auto-scaling
- [x] Load balancing
- [ ] Prometheus + Grafana
- [ ] Custom domain + HTTPS
- [ ] Multi-region deployment
- [ ] Blue-green deployments
- [ ] Canary releases

---

**Built with ❤️ using modern DevOps practices**
