# AutoStack - Project Overview

**Complete Documentation for AI-Powered Full-Stack Deployment Platform**

---

## Table of Contents

1. [Project Summary](#project-summary)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Cost Analysis](#cost-analysis)
6. [Deployment Timeline](#deployment-timeline)
7. [Key Features](#key-features)

---

## Project Summary

AutoStack is a production-grade, AI-powered platform for automated infrastructure deployment and management on AWS. It combines modern DevOps practices with AI capabilities to provide intelligent stack recommendations, automated deployments, and comprehensive monitoring.

### **Core Components**

1. **Frontend (React + Vite)** - Modern web interface for stack management
2. **Backend (FastAPI + Python)** - RESTful API with AI integration
3. **Infrastructure (Terraform + AWS EKS)** - Production-grade Kubernetes cluster
4. **CI/CD (Jenkins + ArgoCD)** - Automated build and deployment pipelines
5. **Monitoring (Prometheus + Grafana)** - Real-time metrics and dashboards

### **Project Goals**

- ✅ One-command infrastructure deployment
- ✅ AI-powered technology recommendations
- ✅ Cost-optimized AWS resources (free-tier + spot instances)
- ✅ Production-ready security and scalability
- ✅ GitOps-based application deployment
- ✅ Comprehensive monitoring and logging

---

## Architecture

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (ap-south-1)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                      │  │
│  │                                                            │  │
│  │  ┌──────────────────┐      ┌──────────────────┐         │  │
│  │  │  Public Subnets  │      │  Private Subnets │         │  │
│  │  │  10.0.1.0/24     │      │  10.0.11.0/24    │         │  │
│  │  │  10.0.2.0/24     │      │  10.0.12.0/24    │         │  │
│  │  └────────┬─────────┘      └────────┬─────────┘         │  │
│  │           │                          │                    │  │
│  │  ┌────────▼──────────────────────────▼────────────┐        │  │
│  │  │         EKS Cluster (v1.28)                  │        │  │
│  │  │                                               │        │  │
│  │  │  ┌─────────────────────────────────────────┐   │        │  │
│  │  │  │  Managed Node Group (t3.small spot)     │   │        │  │
│  │  │  │  - Min: 1, Max: 3, Desired: 1           │   │        │  │
│  │  │  │  - Cluster Autoscaler                   │   │        │  │
│  │  │  └─────────────────────────────────────────┘   │        │  │
│  │  │                                               │        │  │
│  │  │  ┌──────────────────────────────────────────┐  │        │  │
│  │  │  │  Kubernetes Add-ons                       │  │        │  │
│  │  │  │  - AWS Load Balancer Controller           │  │        │  │
│  │  │  │  - Metrics Server                         │  │        │  │
│  │  │  │  - ArgoCD (GitOps)                        │  │        │  │
│  │  │  │  - Prometheus + Grafana                   │  │        │  │
│  │  │  └──────────────────────────────────────────┘  │        │  │
│  │  │                                               │        │  │
│  │  │  ┌──────────────────────────────────────────┐  │        │  │
│  │  │  │  Application Workloads                    │  │        │  │
│  │  │  │  - AutoStack Frontend (React)             │  │        │  │
│  │  │  │  - AutoStack Backend (FastAPI)            │  │        │  │
│  │  │  └──────────────────────────────────────────┘  │        │  │
│  │  └───────────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  │  ┌──────────────────┐                                     │  │
│  │  │  Jenkins EC2     │                                     │  │
│  │  │  (t3.micro)      │                                     │  │
│  │  │  - CI/CD         │                                     │  │
│  │  └──────────────────┘                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  RDS PostgreSQL  │  │  ECR Repositories│  │  SSM Secrets │  │
│  │  (t3.micro)      │  │  - Frontend      │  │  - DB Creds  │  │
│  └──────────────────┘  │  - Backend       │  │  - API Keys  │  │
│                        └──────────────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### **Component Interactions**

```
User → ALB → EKS (Frontend) → Backend API → RDS Database
                    ↓
                ArgoCD (GitOps)
                    ↓
                GitHub Repos
                    ↓
                Jenkins (CI/CD)
```

---

## Technology Stack

### **Infrastructure Layer**

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Cloud Provider | AWS | - | Infrastructure hosting |
| Region | ap-south-1 | - | Mumbai region |
| Container Orchestration | Amazon EKS | 1.28 | Kubernetes cluster |
| Infrastructure as Code | Terraform | 1.13+ | Infrastructure provisioning |
| State Backend | S3 + DynamoDB | - | Terraform state management |

### **Kubernetes Layer**

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Load Balancer | AWS ALB Controller | 1.6.2 | Ingress management |
| Metrics | Metrics Server | 3.11.0 | Resource metrics |
| Auto-scaling | Cluster Autoscaler | 9.29.3 | Node scaling |
| GitOps | ArgoCD | 5.51.6 | Application deployment |
| Monitoring | Prometheus | 55.5.0 | Metrics collection |
| Visualization | Grafana | (bundled) | Dashboards |

### **Application Layer**

#### **Frontend**
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Styling**: TailwindCSS 3.4.1
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **HTTP Client**: Axios 1.7.7
- **Icons**: Lucide React 0.447.0
- **Routing**: React Router DOM 6.27.0

#### **Backend**
- **Framework**: FastAPI 0.115.4
- **Language**: Python 3.11+
- **Database**: PostgreSQL 14
- **ORM**: SQLAlchemy 2.0.36
- **Migrations**: Alembic 1.13.3
- **Authentication**: JWT (python-jose 3.3.0)
- **Password Hashing**: Passlib 1.7.4
- **AI Integration**: OpenAI GPT-4
- **Validation**: Pydantic 2.9.2
- **CORS**: FastAPI CORS Middleware

### **DevOps Tools**

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 20.10+ | Containerization |
| Helm | 3.12+ | Kubernetes package manager |
| kubectl | 1.28+ | Kubernetes CLI |
| AWS CLI | 2.0+ | AWS management |
| Jenkins | Latest | CI/CD automation |

---

## Project Structure

```
auto-stack-deploy/
├── autostack-frontend/          # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── StackCard.jsx
│   │   ├── pages/               # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── StackDetails.jsx
│   │   ├── services/            # API service layer
│   │   │   ├── api.js           # Axios instance
│   │   │   ├── auth.js          # Auth services
│   │   │   └── stacks.js        # Stack services
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── public/                  # Static assets
│   ├── Dockerfile               # Multi-stage Docker build
│   ├── package.json             # Dependencies
│   ├── vite.config.js           # Vite configuration
│   └── tailwind.config.js       # Tailwind configuration
│
├── autostack-backend/           # FastAPI backend application
│   ├── app/
│   │   ├── api/                 # API endpoints
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── stacks.py        # Stack management
│   │   │   ├── deployments.py   # Deployment management
│   │   │   └── health.py        # Health checks
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── stack.py
│   │   │   └── deployment.py
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── stack.py
│   │   │   └── deployment.py
│   │   ├── services/            # Business logic
│   │   │   ├── ai_service.py    # AI recommendations
│   │   │   ├── auth_service.py  # Authentication
│   │   │   └── deployment_service.py
│   │   ├── core/                # Core configurations
│   │   │   ├── config.py        # App configuration
│   │   │   ├── database.py      # Database connection
│   │   │   └── security.py      # Security utilities
│   │   └── main.py              # FastAPI app
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile               # Multi-stage Docker build
│   ├── requirements.txt         # Python dependencies
│   └── pytest.ini               # Test configuration
│
├── infra/                       # Infrastructure as Code
│   ├── terraform/               # Terraform configurations
│   │   ├── modules/             # Reusable Terraform modules
│   │   │   ├── vpc/             # VPC module
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── eks/             # EKS cluster module
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── rds/             # RDS database module
│   │   │   ├── ecr/             # ECR repositories module
│   │   │   ├── jenkins/         # Jenkins EC2 module
│   │   │   ├── secrets/         # SSM secrets module
│   │   │   ├── k8s-addons/      # Kubernetes add-ons
│   │   │   │   ├── main.tf
│   │   │   │   ├── wait-for-webhook.ps1
│   │   │   │   └── variables.tf
│   │   │   └── monitoring/      # Monitoring stack
│   │   ├── main.tf              # Root module
│   │   ├── variables.tf         # Input variables
│   │   ├── outputs.tf           # Output values
│   │   ├── terraform.tfvars     # Variable values
│   │   ├── backend.tf           # S3 backend config
│   │   └── versions.tf          # Provider versions
│   │
│   ├── argocd/                  # ArgoCD configurations
│   │   ├── apps/                # Application manifests
│   │   │   ├── frontend.yaml    # Frontend app
│   │   │   ├── backend.yaml     # Backend app
│   │   │   └── root.yaml        # Root app
│   │   └── projects/            # ArgoCD projects
│   │       └── autostack.yaml
│   │
│   └── helm/                    # Helm charts
│       ├── autostack-frontend/  # Frontend Helm chart
│       │   ├── Chart.yaml
│       │   ├── values.yaml
│       │   └── templates/
│       │       ├── deployment.yaml
│       │       ├── service.yaml
│       │       └── ingress.yaml
│       └── autostack-backend/   # Backend Helm chart
│           ├── Chart.yaml
│           ├── values.yaml
│           └── templates/
│               ├── deployment.yaml
│               ├── service.yaml
│               └── ingress.yaml
│
├── docs/                        # Documentation
│   ├── 01-PROJECT-OVERVIEW.md   # This file
│   ├── 02-FIXES-AND-SOLUTIONS.md
│   ├── 03-FRONTEND-GUIDE.md
│   ├── 04-BACKEND-GUIDE.md
│   └── 05-INFRASTRUCTURE-GUIDE.md
│
├── .github/                     # GitHub workflows
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-ci.yml
│
├── docker-compose.yml           # Local development
├── .gitignore
└── README.md                    # Main documentation
```

---

## Cost Analysis

### **Monthly Cost Breakdown**

| Service | Configuration | Monthly Cost (USD) | Notes |
|---------|--------------|-------------------|-------|
| **EKS Control Plane** | 1 cluster | $73.00 | Fixed cost |
| **EC2 (EKS Nodes)** | 1x t3.small spot | ~$4.50 | 70% savings with spot |
| **Jenkins EC2** | 1x t3.micro | $7.50 | Free tier eligible |
| **RDS PostgreSQL** | 1x db.t3.micro | $12.50 | Free tier eligible |
| **Application Load Balancer** | 1x ALB | $16.20 | ~$0.0225/hour |
| **EBS Volumes** | 60 GB gp3 | $4.80 | $0.08/GB/month |
| **Data Transfer** | ~10 GB/month | $0.90 | First 100GB free |
| **ECR Storage** | ~2 GB | $0.20 | $0.10/GB/month |
| **S3 (Terraform State)** | <1 GB | $0.02 | Minimal usage |
| **DynamoDB (State Lock)** | On-demand | $0.25 | Pay per request |
| **CloudWatch Logs** | ~5 GB | $2.50 | $0.50/GB |
| **SSM Parameter Store** | Standard params | $0.00 | Free |
| **Route53** | 1 hosted zone | $0.50 | Optional |
| **NAT Gateway** | 1x NAT | $32.40 | Can be removed for cost savings |
| | | | |
| **Total (with NAT)** | | **~$155/month** | Production setup |
| **Total (without NAT)** | | **~$122/month** | Cost-optimized |

### **Cost Optimization Strategies**

#### **Implemented**
- ✅ **Spot Instances** - 70% savings on EKS worker nodes
- ✅ **Free Tier** - t3.micro for Jenkins and RDS
- ✅ **Single Node** - Start with 1 node, scale up as needed
- ✅ **gp3 EBS** - 20% cheaper than gp2 with better performance
- ✅ **ECR Lifecycle** - Auto-delete old images after 30 days
- ✅ **CloudWatch Retention** - 7-day log retention
- ✅ **On-Demand DynamoDB** - Pay only for what you use

#### **Additional Savings (Optional)**
- ⚠️ **Remove NAT Gateway** - Use VPC endpoints instead (-$32.40/month)
- ⚠️ **Fargate Spot** - Use Fargate Spot for batch workloads
- ⚠️ **Reserved Instances** - 1-year commitment for 40% savings
- ⚠️ **Savings Plans** - Flexible compute savings
- ⚠️ **Auto-shutdown** - Stop non-prod resources during off-hours

### **Cost Comparison**

| Scenario | Monthly Cost | Use Case |
|----------|-------------|----------|
| **Development** | ~$90 | Single node, no NAT, minimal monitoring |
| **Staging** | ~$122 | Cost-optimized production setup |
| **Production** | ~$155 | Full production with NAT gateway |
| **Enterprise** | ~$300+ | Multi-AZ, reserved instances, enhanced monitoring |

---

## Deployment Timeline

### **Initial Setup (First Time)**

| Phase | Duration | Tasks | Dependencies |
|-------|----------|-------|--------------|
| **Prerequisites** | 10-15 min | Install Terraform, kubectl, Helm, AWS CLI | None |
| **AWS Account Setup** | 5-10 min | Create IAM user, configure credentials, create S3/DynamoDB | AWS account |
| **Terraform Init** | 2-3 min | Initialize backend, download providers | Prerequisites |
| **VPC & Networking** | 3-5 min | Create VPC, subnets, NAT, IGW | Terraform init |
| **EKS Cluster** | 10-12 min | Create EKS control plane and node group | VPC |
| **RDS Database** | 5-7 min | Create PostgreSQL instance | VPC |
| **ECR Repositories** | 1-2 min | Create container registries | None |
| **Jenkins EC2** | 3-5 min | Launch Jenkins instance | VPC |
| **SSM Secrets** | 1-2 min | Store database credentials and API keys | None |
| **ALB Controller** | 3-5 min | Deploy AWS Load Balancer Controller | EKS |
| **Webhook Wait** | 2-5 min | Wait for ALB webhook to be ready | ALB Controller |
| **Metrics Server** | 1-2 min | Deploy metrics server | EKS |
| **Cluster Autoscaler** | 1-2 min | Deploy cluster autoscaler | EKS |
| **ArgoCD** | 3-5 min | Deploy ArgoCD with LoadBalancer | ALB webhook ready |
| **Prometheus + Grafana** | 7-10 min | Deploy monitoring stack | ALB webhook ready |
| **Application Deploy** | 5-10 min | Deploy frontend and backend via ArgoCD | ArgoCD ready |
| | | | |
| **Total** | **52-78 minutes** | **Complete end-to-end deployment** | |

### **Subsequent Deployments**

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Terraform Apply** | 5-10 min | Update existing infrastructure |
| **Application Update** | 2-5 min | ArgoCD auto-sync from Git |
| **Rollback** | 1-2 min | ArgoCD rollback to previous version |
| | | |
| **Total** | **7-15 minutes** | **Updates and changes** |

### **Deployment Phases Breakdown**

#### **Phase 1: Foundation (20-30 min)**
- AWS account setup
- Terraform initialization
- VPC and networking
- EKS cluster creation

#### **Phase 2: Data & CI/CD (10-15 min)**
- RDS database
- ECR repositories
- Jenkins EC2
- Secrets management

#### **Phase 3: Kubernetes Add-ons (15-25 min)**
- ALB controller with webhook wait
- Metrics server
- Cluster autoscaler
- ArgoCD
- Prometheus + Grafana

#### **Phase 4: Applications (5-10 min)**
- Frontend deployment
- Backend deployment
- Service verification

---

## Key Features

### **1. AI-Powered Recommendations**
- Technology stack suggestions based on project requirements
- Best practices recommendations
- Cost optimization suggestions
- Security recommendations

### **2. One-Command Deployment**
```bash
terraform apply -auto-approve
```
- Complete infrastructure provisioning
- Kubernetes cluster setup
- Application deployment
- Monitoring configuration

### **3. GitOps with ArgoCD**
- Automated application deployment
- Git as single source of truth
- Auto-sync from repository
- Easy rollbacks
- Multi-environment support

### **4. Comprehensive Monitoring**
- Prometheus metrics collection
- Grafana dashboards
- Real-time alerts
- Resource utilization tracking
- Application performance monitoring

### **5. Auto-scaling**
- **Horizontal Pod Autoscaler (HPA)** - Scale pods based on CPU/memory
- **Cluster Autoscaler** - Scale nodes based on pod requirements
- **Spot Instance Integration** - Cost-effective scaling

### **6. Security**
- IAM roles with least privilege
- IRSA (IAM Roles for Service Accounts)
- Secrets stored in AWS SSM Parameter Store
- Private subnets for workloads
- Security groups with minimal access
- JWT authentication for API
- HTTPS/TLS for all external endpoints

### **7. High Availability**
- Multi-AZ deployment
- Auto-healing with Kubernetes
- Load balancing with AWS ALB
- Database backups
- Disaster recovery ready

### **8. Developer Experience**
- Simple CLI commands
- Comprehensive documentation
- Local development with Docker Compose
- Hot reload for development
- Easy debugging

---

## Quick Start

### **Prerequisites**
```bash
# Required tools
- Terraform >= 1.13
- kubectl >= 1.28
- Helm >= 3.12
- AWS CLI >= 2.0
- Docker >= 20.10
```

### **Deployment**
```bash
# Clone repository
git clone https://github.com/Raj-glitch-max/auto-stack-deploy.git
cd auto-stack-deploy

# Configure AWS
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="ap-south-1"

# Deploy infrastructure
cd infra/terraform
terraform init
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks

# Verify deployment
kubectl get nodes
kubectl get pods -A
helm list -A
```

---

## Next Steps

- **[Fixes & Solutions](02-FIXES-AND-SOLUTIONS.md)** - All issues resolved during development
- **[Frontend Guide](03-FRONTEND-GUIDE.md)** - React app setup and deployment
- **[Backend Guide](04-BACKEND-GUIDE.md)** - FastAPI app setup and deployment
- **[Infrastructure Guide](05-INFRASTRUCTURE-GUIDE.md)** - Terraform and Kubernetes details

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
