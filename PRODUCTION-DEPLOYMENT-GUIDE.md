# 🚀 PRODUCTION DEPLOYMENT GUIDE

**AutoStack - Billion Dollar Platform**  
**Complete Setup Guide for Real Users**

---

## 📋 REQUIRED CREDENTIALS & SERVICES

### **1. AWS Services (Required for Cost Optimization)**

#### **AWS Cost Explorer API**
```
Required for: Feature #1 - AI Cost Optimization
Purpose: Fetch real-time cost data

Credentials Needed:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (default: us-east-1)

How to Get:
1. Go to AWS Console → IAM
2. Create new user "autostack-cost-explorer"
3. Attach policy: "CostExplorerReadOnlyAccess"
4. Generate access keys
5. Save credentials securely
```

#### **AWS EKS (Kubernetes)**
```
Required for: Deployment engine
Purpose: Deploy user applications

Credentials Needed:
- EKS_CLUSTER_NAME
- EKS_REGION
- AWS_ACCESS_KEY_ID (with EKS permissions)
- AWS_SECRET_ACCESS_KEY

How to Get:
1. Create EKS cluster in AWS Console
2. Note cluster name and region
3. Ensure IAM user has EKS permissions
```

#### **AWS ECR (Container Registry)**
```
Required for: Docker image storage
Purpose: Store built container images

Credentials Needed:
- ECR_REGISTRY_URL
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

How to Get:
1. Create ECR repository in AWS Console
2. Note the registry URL
3. Use same AWS credentials
```

---

### **2. Database (PostgreSQL)**

```
Required for: All features
Purpose: Store all application data

Credentials Needed:
- DATABASE_URL=postgresql://user:password@host:port/dbname

Options:
A. AWS RDS PostgreSQL (Recommended)
   - Go to AWS RDS
   - Create PostgreSQL instance
   - Note connection string

B. Local PostgreSQL (Development)
   - Install PostgreSQL locally
   - Create database "autostack"
   - Use: postgresql://postgres:password@localhost:5432/autostack

C. Supabase (Free tier available)
   - Sign up at supabase.com
   - Create new project
   - Get connection string from settings
```

---

### **3. Authentication (Optional but Recommended)**

#### **Google OAuth**
```
Required for: Google login feature
Purpose: Allow users to sign in with Google

Credentials Needed:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

How to Get:
1. Go to Google Cloud Console
2. Create new project "AutoStack"
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - http://localhost:3000/auth/google/callback
   - https://yourdomain.com/auth/google/callback
```

#### **JWT Secret**
```
Required for: User authentication
Purpose: Sign JWT tokens

Credentials Needed:
- JWT_SECRET (random string, 32+ characters)

How to Generate:
openssl rand -base64 32
```

---

### **4. Email Service (Optional)**

```
Required for: Budget alerts, notifications
Purpose: Send emails to users

Options:
A. SendGrid (Recommended)
   - Sign up at sendgrid.com
   - Get API key
   - SENDGRID_API_KEY

B. AWS SES
   - Enable SES in AWS Console
   - Verify domain
   - Use AWS credentials

C. SMTP
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_USER
   - SMTP_PASSWORD
```

---

### **5. Cloud Providers (For Multi-Cloud Feature)**

#### **Azure (Optional)**
```
Required for: Feature #3 - Multi-Cloud deployments
Purpose: Deploy to Azure

Credentials Needed:
- AZURE_SUBSCRIPTION_ID
- AZURE_CLIENT_ID
- AZURE_CLIENT_SECRET
- AZURE_TENANT_ID

How to Get:
1. Azure Portal → App Registrations
2. Create new registration
3. Generate client secret
4. Note all IDs
```

#### **Google Cloud Platform (Optional)**
```
Required for: Feature #3 - Multi-Cloud deployments
Purpose: Deploy to GCP

Credentials Needed:
- GCP_PROJECT_ID
- GCP_SERVICE_ACCOUNT_KEY (JSON file)

How to Get:
1. GCP Console → IAM & Admin
2. Create service account
3. Generate JSON key
4. Download and save securely
```

---

## 🔧 ENVIRONMENT VARIABLES

### **Backend (.env file)**

Create `autostack-backend/backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/autostack

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-32-chars-minimum

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# AWS EKS
EKS_CLUSTER_NAME=autostack-cluster
EKS_REGION=us-east-1

# AWS ECR
ECR_REGISTRY_URL=123456789.dkr.ecr.us-east-1.amazonaws.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key

# Azure (Optional)
AZURE_SUBSCRIPTION_ID=your-azure-subscription-id
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id

# GCP (Optional)
GCP_PROJECT_ID=your-gcp-project-id
GCP_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
```

### **Frontend (.env.local file)**

Create `autostack-frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
# For production: https://api.yourdomain.com
```

---

## 📦 INSTALLATION STEPS

### **1. Backend Setup**

```bash
cd autostack-backend/backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file (see above)
nano .env

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **2. Frontend Setup**

```bash
cd autostack-frontend

# Install dependencies
npm install

# Create .env.local file (see above)
nano .env.local

# Start development server
npm run dev
```

### **3. Access the Application**

```
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
```

---

## 🚀 PRODUCTION DEPLOYMENT

### **Option 1: AWS (Recommended)**

#### **Backend (AWS ECS/Fargate)**
```bash
1. Build Docker image
   docker build -t autostack-backend .

2. Push to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
   docker tag autostack-backend:latest YOUR_ECR_URL/autostack-backend:latest
   docker push YOUR_ECR_URL/autostack-backend:latest

3. Deploy to ECS
   - Create ECS cluster
   - Create task definition
   - Create service
   - Configure load balancer
```

#### **Frontend (Vercel/Netlify)**
```bash
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy automatically
```

### **Option 2: Kubernetes**

```bash
1. Create Kubernetes manifests
2. Deploy to EKS/GKE/AKS
3. Configure ingress
4. Set up SSL certificates
```

---

## ✅ TESTING CHECKLIST

### **Backend Tests**
- [ ] Database connection works
- [ ] Migrations run successfully
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] AWS Cost Explorer API connects
- [ ] EKS deployment works

### **Frontend Tests**
- [ ] Pages load correctly
- [ ] Login/signup works
- [ ] Cost dashboard displays data
- [ ] Pipeline builder works
- [ ] Template marketplace loads

### **Integration Tests**
- [ ] End-to-end user flow
- [ ] Cost tracking works
- [ ] Pipeline execution works
- [ ] Template deployment works

---

## 🔒 SECURITY CHECKLIST

- [ ] All secrets in environment variables (not code)
- [ ] Database credentials encrypted
- [ ] AWS credentials have minimal permissions
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

---

## 📊 MONITORING & LOGGING

### **Recommended Tools**
- **Sentry**: Error tracking
- **DataDog**: Application monitoring
- **CloudWatch**: AWS logs
- **Prometheus + Grafana**: Metrics

---

## 💰 COST ESTIMATION

### **AWS Costs (Monthly)**
```
EKS Cluster:        $73/month
RDS PostgreSQL:     $15-50/month
ECR Storage:        $0.10/GB
Cost Explorer API:  Free
ECS/Fargate:        $30-100/month (depends on usage)

Total: ~$120-250/month for small scale
```

### **Scaling Costs**
```
1,000 users:   ~$250/month
10,000 users:  ~$1,000/month
100,000 users: ~$5,000/month
```

---

## 🎯 NEXT STEPS

1. **Get AWS Credentials** (Most Important)
   - AWS Access Key & Secret
   - Create EKS cluster
   - Create RDS database

2. **Set Up Database**
   - Create PostgreSQL instance
   - Run migrations
   - Verify connection

3. **Configure Environment**
   - Create .env files
   - Add all credentials
   - Test locally

4. **Deploy to Production**
   - Deploy backend to AWS
   - Deploy frontend to Vercel
   - Configure domain

5. **Test Everything**
   - Run full test suite
   - Verify all features work
   - Monitor for errors

---

## 📞 SUPPORT

If you need help with any step:
1. Check the error logs
2. Verify all credentials are correct
3. Ensure all services are running
4. Check AWS service limits

---

## 🎉 YOU'RE READY!

Once you have:
- ✅ AWS credentials
- ✅ Database connection
- ✅ Environment variables set
- ✅ Services running

**Your billion-dollar platform will be LIVE! 🚀**

---

*Last Updated: November 10, 2025*
