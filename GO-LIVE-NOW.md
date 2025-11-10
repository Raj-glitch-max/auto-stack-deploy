# 🚀 GO LIVE NOW - Complete Guide

**Get your apps on the internet + one-click deployment in 20 minutes**

---

## 🎯 **What You'll Get**

✅ Frontend & Backend live on public internet  
✅ One-click deployment (git push = auto-deploy)  
✅ Real public URLs you can share  
✅ Complete CI/CD automation  

---

## ⚡ **SUPER QUICK START** (Choose Your Path)

### **Path A: Full Production Setup** (20 min)
- Public URLs with AWS Load Balancer
- Jenkins CI/CD automation
- Real production environment
- **Cost: +$32/month (2 load balancers)**

### **Path B: Quick Test Setup** (5 min)
- Use ngrok for temporary public URLs
- Manual deployments
- Free option for testing
- **Cost: $0**

---

## 🔥 **PATH A: FULL PRODUCTION SETUP**

### **Step 1: Make Apps Public** (5 min)

```powershell
# Run the interactive script
.\make-apps-public.ps1

# Choose Option 1 (Network Load Balancer)
# Wait 2-3 minutes for AWS to provision
```

**What happens:**
- Creates 2 AWS Network Load Balancers
- Gets you public DNS names
- Apps are accessible from anywhere
- Saves URLs to `PUBLIC-URLS.txt`

**Result:**
```
Frontend: http://autostack-frontend-xxx.elb.ap-south-1.amazonaws.com
Backend:  http://autostack-backend-xxx.elb.ap-south-1.amazonaws.com
```

### **Step 2: Set Up One-Click Deploy** (15 min)

```powershell
# Run the setup wizard
.\setup-one-click-deploy.ps1
```

**The wizard will guide you through:**

1. **Install Jenkins Plugins** (2 min)
   - Opens Jenkins in browser
   - Shows which plugins to install
   - Waits for you to confirm

2. **Add AWS Credentials** (2 min)
   - Guides you through adding AWS keys
   - Needed for ECR and EKS access

3. **Add GitHub Token** (3 min)
   - Opens GitHub token page
   - Shows required scopes
   - Guides you through adding to Jenkins

4. **Create Pipeline Jobs** (5 min)
   - Backend deployment job
   - Frontend deployment job
   - Configured with Jenkinsfiles

5. **Configure Webhook** (2 min)
   - Opens GitHub webhook page
   - Shows exactly what to enter
   - Enables auto-trigger on push

6. **Test Deployment** (1 min)
   - Creates test commit
   - Pushes to GitHub
   - Watches auto-deploy happen!

### **Step 3: Test It!** (5 min)

```bash
# Make a simple change
echo "// updated!" >> autostack-backend/backend/main.py

# Commit and push
git add .
git commit -m "feat: test deployment"
git push origin main

# Watch the magic! ✨
# - Jenkins builds automatically
# - Pushes to ECR
# - ArgoCD syncs
# - Pods update on EKS
# - Live app updates!
```

**Monitor the deployment:**
```powershell
# Watch Jenkins build
# Open: http://65.2.39.10:8080

# Watch ArgoCD sync
kubectl get applications -n argocd -w

# Watch pods update
kubectl get pods -n default -w
```

---

## 💨 **PATH B: QUICK TEST SETUP** (Free)

### **Step 1: Install ngrok**

```powershell
# Download ngrok
# https://ngrok.com/download

# Sign up (free)
# https://dashboard.ngrok.com/signup

# Configure auth token
ngrok config add-authtoken YOUR_TOKEN
```

### **Step 2: Expose Frontend**

```powershell
# Terminal 1: Port forward
kubectl port-forward svc/autostack-frontend -n default 3000:3000

# Terminal 2: Expose with ngrok
ngrok http 3000

# Copy the URL: https://xxxx.ngrok.io
```

### **Step 3: Expose Backend**

```powershell
# Terminal 3: Port forward
kubectl port-forward svc/autostack-backend -n default 8000:8000

# Terminal 4: Expose with ngrok
ngrok http 8000

# Copy the URL: https://yyyy.ngrok.io
```

**Result:**
```
Frontend: https://xxxx.ngrok.io
Backend:  https://yyyy.ngrok.io
API Docs: https://yyyy.ngrok.io/docs
```

**Note:** ngrok URLs are temporary and change when you restart

---

## 🎯 **COMPARISON**

| Feature | Path A (Production) | Path B (Testing) |
|---------|---------------------|------------------|
| **Setup Time** | 20 min | 5 min |
| **Cost** | +$32/month | Free |
| **URL Stability** | Permanent | Temporary |
| **Auto-Deploy** | ✅ Yes | ❌ Manual |
| **SSL/HTTPS** | Add ALB (+$16) | ✅ Built-in |
| **Best For** | Production | Demo/Test |

---

## 🚀 **AFTER SETUP - HOW TO USE**

### **Daily Workflow**

```bash
# 1. Make code changes locally
code autostack-backend/backend/main.py

# 2. Test locally (optional)
docker-compose up  # if you have local compose

# 3. Commit changes
git add .
git commit -m "feat: your awesome feature"

# 4. Push to GitHub
git push origin main

# 5. Auto-deploy happens!
# ✅ Jenkins builds
# ✅ Pushes to ECR
# ✅ ArgoCD syncs
# ✅ Deploys to EKS
# ✅ Live in ~5 minutes
```

### **Monitor Deployment**

```powershell
# Jenkins
http://65.2.39.10:8080/job/autostack-backend-deploy/

# ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:80
# http://localhost:8080

# Pods
kubectl get pods -n default -w

# Logs
kubectl logs -f deployment/autostack-backend -n default
```

---

## 📊 **VERIFY IT'S WORKING**

### **Test Frontend**
```bash
# Using your public URL
curl https://your-frontend-url.com

# Should return HTML
```

### **Test Backend**
```bash
# Health check
curl https://your-backend-url.com/health
# Returns: {"status":"ok"}

# API docs
# Open in browser: https://your-backend-url.com/docs
```

### **Test Auto-Deploy**
```bash
# Make a visible change
echo "console.log('v2.0')" >> autostack-frontend/src/App.jsx

git add .
git commit -m "test: version 2.0"
git push origin main

# Watch Jenkins: Should start building automatically
# Wait 5 minutes
# Check live URL: Should show updated version
```

---

## 🎉 **SUCCESS CRITERIA**

You're live when:

✅ Public URLs are accessible from any browser  
✅ Frontend loads correctly  
✅ Backend /health returns OK  
✅ API docs are accessible  
✅ Git push triggers Jenkins automatically  
✅ Jenkins build completes successfully  
✅ ArgoCD syncs the changes  
✅ New pods roll out on EKS  
✅ Live apps update with new code  

---

## 🔧 **TROUBLESHOOTING**

### **Load Balancer Stuck "Pending"**
```bash
# Check service
kubectl describe svc autostack-frontend -n default

# Check LB controller logs
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# Usually just needs more time (up to 5 min)
```

### **Jenkins Not Triggering**
```bash
# Check webhook delivery
# GitHub → Settings → Webhooks → Recent Deliveries

# Verify webhook URL is correct
# Should be: http://65.2.39.10:8080/github-webhook/

# Check Jenkins logs
# Jenkins → Manage → System Log
```

### **Pods Not Updating**
```bash
# Check ArgoCD sync status
kubectl describe application autostack-backend -n argocd

# Force sync
kubectl -n argocd patch application autostack-backend \
  --type merge -p '{"operation":{"sync":{"revision":"HEAD"}}}'

# Check image tag in deployment
kubectl get deployment autostack-backend -n default -o yaml | grep image:
```

---

## 💰 **COST BREAKDOWN**

### **Production Setup (Path A)**

| Service | Config | Monthly Cost |
|---------|--------|--------------|
| Existing Infrastructure | EKS, RDS, etc | $126 |
| Frontend NLB | 1 load balancer | $16 |
| Backend NLB | 1 load balancer | $16 |
| **New Total** | | **$158/month** |

**ROI:** Professional setup, production-ready, unlimited deploys

### **Test Setup (Path B)**

| Service | Config | Monthly Cost |
|---------|--------|--------------|
| Existing Infrastructure | EKS, RDS, etc | $126 |
| ngrok Free Tier | Temporary URLs | $0 |
| **Total** | | **$126/month** |

**ROI:** Great for demos, testing, MVP validation

---

## 🎓 **NEXT STEPS**

### **After Going Live**

1. **Add Custom Domain** (Optional)
   - Buy domain on Route53 or Namecheap
   - Create CNAME pointing to Load Balancer
   - Update frontend CORS settings

2. **Add SSL/HTTPS** (Recommended)
   - Use AWS Certificate Manager (free)
   - Update Load Balancer listener
   - Redirect HTTP → HTTPS

3. **Add Monitoring**
   - Enable Prometheus + Grafana
   - Set up custom dashboards
   - Configure alerts

4. **Scale Up**
   - Increase node count if needed
   - Adjust resource limits
   - Enable autoscaling policies

---

## 🔥 **YOU'RE READY!**

Choose your path and run the scripts:

```powershell
# Production setup
.\make-apps-public.ps1          # Get public URLs
.\setup-one-click-deploy.ps1    # Enable CI/CD

# Or quick test
# Use ngrok for temporary URLs
```

**In 20 minutes, you'll have:**
- ✅ Live apps on the internet
- ✅ One-click deployment
- ✅ Production-ready CI/CD
- ✅ Real public URLs to share

**LET'S GOOOOO! 🚀**
