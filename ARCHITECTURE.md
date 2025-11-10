# 🏗️ System Architecture

Complete architecture documentation for AutoStack cloud-native deployment platform.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Infrastructure Architecture](#infrastructure-architecture)
3. [Application Architecture](#application-architecture)
4. [Deployment Architecture](#deployment-architecture)
5. [Security Architecture](#security-architecture)
6. [Design Decisions](#design-decisions)

---

## 🎯 Overview

AutoStack is a production-ready, cloud-native deployment platform built on AWS EKS with complete GitOps and CI/CD automation.

### **Key Characteristics**
- **Cloud-Native**: Built for Kubernetes from the ground up
- **GitOps-Driven**: All deployments managed via Git
- **Zero-Downtime**: Rolling updates with health checks
- **Auto-Scaling**: Horizontal pod and cluster autoscaling
- **Secure**: IAM roles, VPC isolation, encrypted secrets
- **Observable**: Metrics, logging, and tracing ready

### **Tech Stack**
```
Frontend:  React 18 + Next.js 15 + TypeScript
Backend:   FastAPI + Python 3.11 + SQLAlchemy (async)
Database:  PostgreSQL 15
Container: Docker
Orchestration: Kubernetes (AWS EKS 1.28)
IaC:       Terraform + Helm
GitOps:    ArgoCD
CI/CD:     Jenkins
Cloud:     AWS (EKS, ECR, RDS, VPC, ELB)
```

---

## ☁️ Infrastructure Architecture

### **AWS Infrastructure Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Account                            │
│                     Region: ap-south-1 (Mumbai)                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │      VPC 10.0.0.0/16   │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
  ┌─────▼─────┐          ┌──────▼──────┐         ┌──────▼──────┐
  │  Public   │          │   Public    │         │   Private   │
  │  Subnet   │          │   Subnet    │         │   Subnet    │
  │ AZ-1a     │          │   AZ-1b     │         │   AZ-1a     │
  │           │          │             │         │             │
  │ ┌───────┐ │          │  ┌───────┐  │         │  ┌───────┐  │
  │ │  NAT  │ │          │  │  NAT  │  │         │  │  EKS  │  │
  │ │Gateway│ │          │  │Gateway│  │         │  │ Nodes │  │
  │ └───────┘ │          │  └───────┘  │         │  └───────┘  │
  └───────────┘          └─────────────┘         └─────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Internet Gateway       │
                    └─────────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │    Internet     │
                        └─────────────────┘
```

### **Kubernetes Cluster Architecture**

```
┌───────────────────────────────────────────────────────────────┐
│                    EKS Control Plane (Managed)                │
│                     Kubernetes API Server                     │
│              etcd, Scheduler, Controller Manager              │
└───────────────────────────┬───────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
   │  Node 1 │         │  Node 2 │        │  Node 3 │
   │t3.small │         │t3.small │        │t3.small │
   │         │         │         │        │         │
   │ ┌─────┐ │         │ ┌─────┐ │        │ ┌─────┐ │
   │ │ Pod │ │         │ │ Pod │ │        │ │ Pod │ │
   │ │Front│ │         │ │Back │ │        │ │ DB  │ │
   │ └─────┘ │         │ └─────┘ │        │ └─────┘ │
   │         │         │         │        │         │
   │ ┌─────┐ │         │ ┌─────┐ │        │         │
   │ │Kube │ │         │ │Kube │ │        │         │
   │ │Proxy│ │         │ │Proxy│ │        │         │
   │ └─────┘ │         │ └─────┘ │        │         │
   └─────────┘         └─────────┘        └─────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    ┌───────▼────────┐
                    │  AWS ELB       │
                    │ Load Balancer  │
                    └────────────────┘
```

### **Component Breakdown**

#### **VPC Configuration**
```
VPC CIDR:          10.0.0.0/16
Public Subnets:    10.0.1.0/24 (AZ-1a), 10.0.2.0/24 (AZ-1b)
Private Subnets:   10.0.10.0/24 (AZ-1a), 10.0.11.0/24 (AZ-1b)
NAT Gateways:      2 (one per AZ for high availability)
Internet Gateway:  1
```

#### **EKS Cluster**
```
Version:           1.28
Node Group:        Managed node group
Instance Type:     t3.small (2 vCPU, 2GB RAM)
Node Count:        3 (min: 1, max: 3)
AMI:               Amazon Linux 2 EKS Optimized
```

#### **Add-ons**
```
- metrics-server           (resource monitoring)
- cluster-autoscaler       (node autoscaling)
- aws-load-balancer-controller (L4/L7 load balancing)
- argocd                   (GitOps deployments)
```

---

## 🎨 Application Architecture

### **Three-Tier Architecture**

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                 │
│                                                     │
│   ┌─────────────────────────────────────────┐     │
│   │          React Frontend                 │     │
│   │  Next.js 15 + TypeScript + TailwindCSS  │     │
│   │         Port: 3000                      │     │
│   └──────────────────┬──────────────────────┘     │
└────────────────────────┴──────────────────────────┘
                        │ HTTP/REST
                        │
┌────────────────────────┴──────────────────────────┐
│                 Application Layer                 │
│                                                   │
│   ┌─────────────────────────────────────────┐   │
│   │         FastAPI Backend                 │   │
│   │    Python 3.11 + Async SQLAlchemy      │   │
│   │           Port: 8000                    │   │
│   │                                         │   │
│   │  Modules:                               │   │
│   │  ├─ Authentication (JWT)                │   │
│   │  ├─ User Management                     │   │
│   │  ├─ GitHub Integration                  │   │
│   │  ├─ Deployment Engine                   │   │
│   │  └─ API Routes                          │   │
│   └──────────────────┬──────────────────────┘   │
└────────────────────────┴──────────────────────────┘
                        │ PostgreSQL Protocol
                        │
┌────────────────────────┴──────────────────────────┐
│                   Data Layer                      │
│                                                   │
│   ┌─────────────────────────────────────────┐   │
│   │         PostgreSQL 15                   │   │
│   │      Async Connection Pool              │   │
│   │           Port: 5432                    │   │
│   │                                         │   │
│   │  Features:                              │   │
│   │  ├─ Alembic Migrations                  │   │
│   │  ├─ Async Queries (asyncpg)            │   │
│   │  ├─ Connection Pooling                  │   │
│   │  └─ Transactional Integrity             │   │
│   └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

### **Data Flow**

```
1. User Request
   │
   ▼
2. Load Balancer (AWS ELB)
   │
   ▼
3. Frontend Pod (React/Next.js)
   │
   ├─ Static Assets (served by Next.js)
   │
   └─ API Calls
      │
      ▼
   4. Backend Pod (FastAPI)
      │
      ├─ Authentication (JWT validation)
      │
      ├─ Business Logic
      │
      └─ Database Query
         │
         ▼
      5. PostgreSQL Pod
         │
         ├─ Execute Query
         │
         └─ Return Data
            │
            ▼
         6. Response to User
```

### **Database Schema**

```sql
-- Users table
users:
  - id (UUID, PK)
  - email (VARCHAR, UNIQUE)
  - hashed_password (VARCHAR)
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Refresh tokens table
refresh_tokens:
  - id (UUID, PK)
  - user_id (UUID, FK -> users.id)
  - token (VARCHAR, UNIQUE)
  - expires_at (TIMESTAMP)
  - created_at (TIMESTAMP)

-- Deployments table (future)
deployments:
  - id (UUID, PK)
  - user_id (UUID, FK)
  - repo_url (VARCHAR)
  - status (ENUM)
  - created_at (TIMESTAMP)
```

---

## 🔄 Deployment Architecture

### **GitOps Flow**

```
Developer                    Git Repository              ArgoCD                  Kubernetes
────────                    ──────────────              ──────                  ──────────

   │                              │                        │                         │
   │ 1. Code Change               │                        │                         │
   ├─────────────────────────────>│                        │                         │
   │                              │                        │                         │
   │                              │ 2. Detects Change      │                         │
   │                              │<───────────────────────│                         │
   │                              │                        │                         │
   │                              │ 3. Pull Manifests      │                         │
   │                              ├───────────────────────>│                         │
   │                              │                        │                         │
   │                              │                        │ 4. Apply Resources      │
   │                              │                        ├────────────────────────>│
   │                              │                        │                         │
   │                              │                        │ 5. Rolling Update       │
   │                              │                        │                         │
   │                              │                        │<────────────────────────│
   │                              │                        │   Pods Updated          │
   │                              │                        │                         │
```

### **CI/CD Pipeline**

```
┌──────────────────────────────────────────────────────────────────┐
│                      CI/CD Pipeline Flow                         │
└──────────────────────────────────────────────────────────────────┘

1. git push origin main
   │
   ▼
2. GitHub Webhook → Jenkins
   │
   ├─ Trigger: autostack-backend-deploy
   │  or autostack-frontend-deploy
   │
   ▼
3. Jenkins Pipeline (Jenkinsfile)
   │
   ├─ Stage 1: Checkout Code
   │  └─ Clone from GitHub
   │
   ├─ Stage 2: Build Docker Image
   │  ├─ docker build -t <image>:<tag>
   │  └─ Tag with build number
   │
   ├─ Stage 3: Run Tests (optional)
   │  └─ pytest / npm test
   │
   ├─ Stage 4: Push to ECR
   │  ├─ aws ecr get-login-password
   │  └─ docker push <ecr-repo>:<tag>
   │
   ├─ Stage 5: Update GitOps Repo
   │  ├─ Update image tag in ArgoCD app
   │  └─ git commit + push
   │
   └─ Stage 6: Trigger ArgoCD Sync
      └─ kubectl patch application
      │
      ▼
4. ArgoCD Auto-Sync
   │
   ├─ Detect GitOps repo change
   ├─ Compare desired vs actual state
   └─ Apply changes to cluster
      │
      ▼
5. Kubernetes Rolling Update
   │
   ├─ Create new pods with new image
   ├─ Wait for readiness probes
   ├─ Gradually shift traffic
   └─ Terminate old pods
      │
      ▼
6. ✅ Deployment Complete
   └─ Zero downtime achieved!
```

### **Helm Chart Structure**

```
infra/helm/
├── autostack-frontend/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── hpa.yaml
│       ├── serviceaccount.yaml
│       └── pdb.yaml
│
└── autostack-backend/
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        ├── deployment.yaml
        ├── service.yaml
        ├── hpa.yaml
        ├── serviceaccount.yaml
        ├── pdb.yaml
        └── postgres-deployment.yaml
```

---

## 🔒 Security Architecture

### **Defense in Depth**

```
Layer 1: Network Security
├─ VPC Isolation
├─ Security Groups
├─ NACLs
└─ Private Subnets for workloads

Layer 2: IAM & Access Control
├─ IAM Roles (not access keys)
├─ IRSA (IAM Roles for Service Accounts)
├─ Least privilege principle
└─ MFA for human access

Layer 3: Kubernetes Security
├─ Network Policies
├─ Pod Security Standards
├─ RBAC (Role-Based Access Control)
└─ Service Accounts

Layer 4: Application Security
├─ JWT Authentication
├─ Password hashing (bcrypt)
├─ Input validation
└─ SQL injection prevention (ORM)

Layer 5: Data Security
├─ Encryption at rest (EBS, RDS)
├─ Encryption in transit (TLS)
├─ Secrets management (K8s Secrets)
└─ Database connection encryption
```

### **Authentication Flow**

```
1. User Login
   │
   ├─ POST /api/v1/auth/login
   │  Body: { email, password }
   │
   ▼
2. Backend Validates
   │
   ├─ Query user from database
   ├─ Verify password (bcrypt)
   └─ Generate JWT tokens
      │
      ├─ Access Token (30 min expiry)
      └─ Refresh Token (7 day expiry)
      │
      ▼
3. Return Tokens
   │
   └─ Response: {
        access_token: "eyJ...",
        refresh_token: "eyJ...",
        token_type: "bearer"
      }
      │
      ▼
4. Subsequent Requests
   │
   ├─ Header: Authorization: Bearer <access_token>
   │
   ▼
5. Token Validation
   │
   ├─ Verify signature
   ├─ Check expiration
   └─ Extract user_id
      │
      ▼
6. Process Request
   │
   └─ Return protected resource
```

---

## 🎯 Design Decisions

### **Why EKS over Self-Managed Kubernetes?**

**Chosen**: AWS EKS

**Reasons**:
- Managed control plane (less operational overhead)
- Automatic upgrades and patching
- Integration with AWS services (IAM, VPC, ELB)
- Enterprise support available
- Cost-effective for production workloads

**Trade-off**: Higher cost than self-managed ($73/month for control plane)

---

### **Why ArgoCD over Flux?**

**Chosen**: ArgoCD

**Reasons**:
- Better UI/UX for visualizing deployments
- More mature and widely adopted
- Excellent documentation and community
- Built-in RBAC and multi-tenancy
- Easier troubleshooting with UI

**Trade-off**: Slightly more resource-intensive

---

### **Why FastAPI over Flask/Django?**

**Chosen**: FastAPI

**Reasons**:
- Native async support (better performance)
- Automatic API documentation (OpenAPI/Swagger)
- Type hints and validation (Pydantic)
- Modern Python 3.11 features
- Great developer experience

**Trade-off**: Smaller ecosystem than Flask

---

### **Why Next.js over Create React App?**

**Chosen**: Next.js 15

**Reasons**:
- Server-side rendering (SSR) for better SEO
- File-based routing
- API routes (BFF pattern)
- Optimized image handling
- Built-in performance optimizations

**Trade-off**: More complex than CRA

---

### **Why PostgreSQL over MySQL/MongoDB?**

**Chosen**: PostgreSQL 15

**Reasons**:
- ACID compliance
- Advanced features (JSON, full-text search)
- Better performance for complex queries
- Strong community and tooling
- Native support for async drivers (asyncpg)

**Trade-off**: Slightly harder to scale horizontally

---

### **Why Classic ELB over ALB/NLB?**

**Chosen**: AWS Classic Elastic Load Balancer

**Reasons**:
- Simpler configuration
- Works out-of-the-box with Kubernetes
- Lower cost for small workloads
- Adequate for current traffic levels

**Trade-off**: Less features than ALB (no host/path routing)

---

## 📊 Scalability Architecture

### **Horizontal Pod Autoscaling (HPA)**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: autostack-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: autostack-backend
  minReplicas: 1
  maxReplicas: 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### **Cluster Autoscaling**

```
Node Scaling:
├─ Min Nodes: 1
├─ Max Nodes: 3
├─ Desired: 2
│
└─ Scale Up Triggers:
   ├─ Pods in Pending state (insufficient resources)
   └─ CPU/Memory pressure across nodes
   
└─ Scale Down Triggers:
   ├─ Node utilization < 50% for 10 minutes
   └─ Pods can be rescheduled safely
```

---

## 🔍 Observability Architecture

### **Metrics Collection**

```
Application → Metrics Server → Prometheus → Grafana
                    │
                    └─→ CloudWatch

Metrics Collected:
├─ CPU Usage (per pod, per node)
├─ Memory Usage
├─ Network I/O
├─ Disk I/O
├─ HTTP Request Rate
├─ Error Rate
└─ Request Latency
```

### **Logging Pipeline**

```
Application Logs → stdout/stderr → Container Runtime →
Kubelet → CloudWatch Logs → CloudWatch Insights
```

### **Health Checks**

```yaml
# Liveness Probe (restart if fails)
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

# Readiness Probe (remove from load balancer if fails)
readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 💰 Cost Architecture

### **Monthly Cost Breakdown**

```
Fixed Costs:
├─ EKS Control Plane: $73.00 (24/7)
├─ Jenkins EC2: $7.50 (24/7)
└─ NAT Gateways: $65.00 (2x $32.50)

Variable Costs:
├─ EC2 Nodes: $13.50 (3x t3.small spot, can scale to 0)
├─ Load Balancers: $36.00 (2x Classic ELB)
├─ RDS: $12.50 (db.t3.micro)
├─ EBS: $9.60 (120GB)
├─ Data Transfer: $3.00
└─ Other: $2.00

Total: ~$162/month

Optimization Opportunities:
├─ Use Spot Instances: Save 70% on compute
├─ Reserved Instances: Save 40% for 1-year commitment
├─ Single NAT Gateway: Save $32.50/month
└─ Fargate: Pay only for pod running time
```

---

## 🚀 Future Architecture Enhancements

### **Phase 2: Advanced Features**
- Service Mesh (Istio/Linkerd) for advanced traffic management
- Observability Stack (Prometheus + Grafana + Loki)
- Secrets Management (External Secrets Operator + AWS Secrets Manager)
- Certificate Management (cert-manager + Let's Encrypt)

### **Phase 3: Multi-Region**
- Active-active deployment across regions
- Global load balancing (Route53 with health checks)
- Cross-region database replication
- Disaster recovery automation

### **Phase 4: Advanced Deployment Strategies**
- Blue-Green deployments
- Canary releases with Flagger
- A/B testing with feature flags
- Progressive delivery

---

**This architecture is designed to be production-ready, scalable, and maintainable. It follows cloud-native best practices and can evolve with your needs.**
