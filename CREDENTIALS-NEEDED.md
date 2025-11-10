# 🔑 CREDENTIALS CHECKLIST

**What You Need to Provide for Production Deployment**

---

## ✅ REQUIRED (Must Have)

### **1. AWS Credentials**
```
☐ AWS_ACCESS_KEY_ID
☐ AWS_SECRET_ACCESS_KEY
☐ AWS_REGION (e.g., us-east-1)

Purpose: Cost tracking, deployments
Where: AWS Console → IAM → Users → Create Access Key
```

### **2. Database**
```
☐ DATABASE_URL

Example: postgresql://user:password@host:5432/autostack

Options:
- AWS RDS (Recommended): ~$15-50/month
- Supabase (Free tier): supabase.com
- Local PostgreSQL (Development only)
```

### **3. JWT Secret**
```
☐ JWT_SECRET

Generate with: openssl rand -base64 32
Purpose: Secure user authentication
```

---

## 🎯 HIGHLY RECOMMENDED

### **4. AWS EKS (For Deployments)**
```
☐ EKS_CLUSTER_NAME
☐ EKS_REGION

Purpose: Deploy user applications
Cost: ~$73/month for cluster
Setup: AWS Console → EKS → Create Cluster
```

### **5. AWS ECR (Container Registry)**
```
☐ ECR_REGISTRY_URL

Purpose: Store Docker images
Setup: AWS Console → ECR → Create Repository
```

---

## 📧 OPTIONAL (For Full Features)

### **6. Google OAuth (For Google Login)**
```
☐ GOOGLE_CLIENT_ID
☐ GOOGLE_CLIENT_SECRET

Setup: Google Cloud Console → APIs & Services → Credentials
```

### **7. Email Service (For Notifications)**
```
☐ SENDGRID_API_KEY (Recommended)
OR
☐ SMTP credentials

Purpose: Send budget alerts, notifications
```

### **8. Azure (For Multi-Cloud)**
```
☐ AZURE_SUBSCRIPTION_ID
☐ AZURE_CLIENT_ID
☐ AZURE_CLIENT_SECRET
☐ AZURE_TENANT_ID
```

### **9. GCP (For Multi-Cloud)**
```
☐ GCP_PROJECT_ID
☐ GCP_SERVICE_ACCOUNT_KEY
```

---

## 📝 QUICK START (Minimum Setup)

**To get started quickly, you only need:**

1. **AWS Credentials** (Access Key + Secret)
2. **Database URL** (PostgreSQL)
3. **JWT Secret** (Random string)

**That's it! The platform will work with just these 3 things!**

---

## 💡 WHAT TO DO NOW

### **Step 1: Get AWS Credentials**
```bash
1. Go to AWS Console
2. Navigate to IAM → Users
3. Click "Create User"
4. Name: "autostack-admin"
5. Attach policies:
   - CostExplorerReadOnlyAccess
   - AmazonEKSClusterPolicy (if using EKS)
   - AmazonEC2ContainerRegistryFullAccess (if using ECR)
6. Create access key
7. Save the credentials securely!
```

### **Step 2: Set Up Database**
```bash
Option A - AWS RDS (Production):
1. AWS Console → RDS
2. Create PostgreSQL database
3. Note the connection string

Option B - Supabase (Free):
1. Go to supabase.com
2. Create account
3. Create new project
4. Get connection string from Settings

Option C - Local (Development):
1. Install PostgreSQL
2. Create database: createdb autostack
3. Use: postgresql://postgres:password@localhost:5432/autostack
```

### **Step 3: Generate JWT Secret**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or just use a random string (32+ characters):
your-super-secret-jwt-key-here-make-it-long-and-random
```

### **Step 4: Create .env File**
```bash
cd autostack-backend/backend
nano .env

# Paste this and fill in your values:
DATABASE_URL=postgresql://user:password@host:5432/autostack
JWT_SECRET=your-generated-secret-here
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
```

### **Step 5: Run Migrations & Start**
```bash
# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🎯 PRIORITY ORDER

**Get these in order:**

1. **AWS Credentials** ⭐⭐⭐ (CRITICAL)
2. **Database** ⭐⭐⭐ (CRITICAL)
3. **JWT Secret** ⭐⭐⭐ (CRITICAL)
4. **EKS Cluster** ⭐⭐ (Important for deployments)
5. **Google OAuth** ⭐ (Nice to have)
6. **Email Service** ⭐ (Nice to have)
7. **Azure/GCP** (Optional, for multi-cloud)

---

## 📞 READY TO PROVIDE?

**Please provide the following:**

```
1. AWS Access Key ID: _________________
2. AWS Secret Access Key: _________________
3. AWS Region: _________________
4. Database URL: _________________
5. JWT Secret: _________________ (or I can generate one)

Optional:
6. Google Client ID: _________________
7. Google Client Secret: _________________
8. SendGrid API Key: _________________
```

**Once you provide these, I'll:**
- ✅ Create the .env file
- ✅ Test the connection
- ✅ Run migrations
- ✅ Start the servers
- ✅ Verify everything works!

---

## 🚀 LET'S GO LIVE!

**With just 3-5 credentials, your billion-dollar platform will be running! 💰**

---

*Last Updated: November 10, 2025*
