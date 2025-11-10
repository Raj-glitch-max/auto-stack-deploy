# 🚀 Jenkins CI/CD Setup Guide

**Goal**: Enable one-click deployment - every `git push` automatically deploys to your live apps!

---

## 📋 **Setup Checklist**

- [ ] Install Jenkins plugins
- [ ] Add AWS credentials
- [ ] Add GitHub token
- [ ] Create backend pipeline job
- [ ] Create frontend pipeline job
- [ ] Configure GitHub webhook
- [ ] Test deployment!

---

## 🔧 **STEP 1: Install Jenkins Plugins** (5 min)

### Open Plugin Manager:
```
http://65.2.39.10:8080/pluginManager/available
```

### Install these plugins:

1. **Docker Pipeline** - For building Docker images
2. **Git Plugin** - For Git operations
3. **GitHub Plugin** - For GitHub integration
4. **AWS Steps** - For AWS/ECR operations
5. **Kubernetes CLI Plugin** - For kubectl commands
6. **Pipeline: Stage View** - For visual pipeline view
7. **Credentials Binding Plugin** - For secure credential handling

### How to install:
1. Search for each plugin name in the "Available" tab
2. Check the box next to each plugin
3. Click "Install without restart" at the bottom
4. Wait for installation to complete (shows progress)
5. ✅ **Done when all show "Success"**

---

## 🔑 **STEP 2: Add AWS Credentials** (3 min)

### Navigate to:
```
http://65.2.39.10:8080/credentials/store/system/domain/_/newCredentials
```

### Fill in:
- **Kind**: AWS Credentials
- **ID**: `aws-credentials` (IMPORTANT: exact name!)
- **Description**: AWS credentials for ECR and EKS
- **Access Key ID**: Your AWS access key
- **Secret Access Key**: Your AWS secret key
- **Region**: ap-south-1

### Click "Create"

✅ **AWS credentials added!**

---

## 🔑 **STEP 3: Add GitHub Token** (3 min)

### Create GitHub token first:
1. Go to: https://github.com/settings/tokens/new
2. **Note**: Jenkins CI/CD Token
3. **Expiration**: No expiration (or 1 year)
4. **Select scopes**:
   - ✅ repo (all)
   - ✅ workflow
   - ✅ write:packages
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

### Add to Jenkins:
```
http://65.2.39.10:8080/credentials/store/system/domain/_/newCredentials
```

### Fill in:
- **Kind**: Secret text
- **ID**: `github-token` (IMPORTANT: exact name!)
- **Secret**: Paste your GitHub token
- **Description**: GitHub token for repo access

### Click "Create"

✅ **GitHub token added!**

---

## 🏗️ **STEP 4: Create Backend Pipeline Job** (5 min)

### Navigate to:
```
http://65.2.39.10:8080/view/all/newJob
```

### Create job:
1. **Item name**: `autostack-backend-deploy`
2. **Type**: Select "Pipeline"
3. Click "OK"

### Configure the job:

#### General section:
- **Description**: AutoStack Backend CI/CD Pipeline

#### Build Triggers section:
- ✅ Check "GitHub hook trigger for GITScm polling"

#### Pipeline section:
- **Definition**: Pipeline script from SCM
- **SCM**: Git
- **Repository URL**: `https://github.com/Raj-glitch-max/auto-stack-deploy.git`
- **Branch Specifier**: `*/main`
- **Script Path**: `Jenkinsfile.backend`

### Click "Save"

✅ **Backend job created!**

---

## 🏗️ **STEP 5: Create Frontend Pipeline Job** (3 min)

### Navigate to:
```
http://65.2.39.10:8080/view/all/newJob
```

### Create job:
1. **Item name**: `autostack-frontend-deploy`
2. **Type**: Select "Pipeline"
3. Click "OK"

### Configure (same as backend but):
- **Description**: AutoStack Frontend CI/CD Pipeline
- **Script Path**: `Jenkinsfile.frontend` (DIFFERENT!)

### Click "Save"

✅ **Frontend job created!**

---

## 🔗 **STEP 6: Configure GitHub Webhook** (2 min)

### Navigate to:
```
https://github.com/Raj-glitch-max/auto-stack-deploy/settings/hooks/new
```

### Fill in:
- **Payload URL**: `http://65.2.39.10:8080/github-webhook/`
  - ⚠️ **Include the trailing slash!**
- **Content type**: application/json
- **Which events**: Just the push event
- **Active**: ✅ Checked

### Click "Add webhook"

### Verify:
- You should see a green checkmark ✅
- Click on the webhook → "Recent Deliveries" tab
- Should show successful ping

✅ **Webhook configured!**

---

## 🧪 **STEP 7: Test Deployment!** (10 min)

### Make a test change:

```powershell
# In your project directory
cd C:\Projects

# Make a small change
echo "// CI/CD test $(Get-Date)" >> autostack-backend/backend/main.py

# Commit and push
git add .
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```

### Watch the magic! ✨

1. **GitHub**: Push completes
2. **Jenkins**: Automatically starts building
   - Check: http://65.2.39.10:8080/job/autostack-backend-deploy/
3. **ECR**: New Docker image pushed
4. **ArgoCD**: Detects change and syncs
   - Check: `kubectl get applications -n argocd`
5. **EKS**: New pods roll out
   - Check: `kubectl get pods -n default -w`
6. **Live App**: Updates on your public URL!
   - Check: http://[your-backend-url]/docs

**Total time**: ~5 minutes from push to production! 🚀

---

## 📊 **Monitoring Your Deployments**

### Jenkins Build Status:
```
http://65.2.39.10:8080
```

### ArgoCD Applications:
```powershell
kubectl get applications -n argocd
kubectl port-forward svc/argocd-server -n argocd 8080:80
# Open: http://localhost:8080
# Username: admin
# Password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

### Pod Status:
```powershell
kubectl get pods -n default -w
kubectl logs -f deployment/autostack-backend -n default
```

### Your Live Apps:
```
See PUBLIC-URLS.txt for your permanent URLs
```

---

## 🎯 **What Happens on Every Git Push**

```
1. Developer: git push origin main
   ↓
2. GitHub: Receives push, triggers webhook
   ↓
3. Jenkins: Webhook received, starts pipeline
   ↓
4. Pipeline Stage 1: Checkout code from GitHub
   ↓
5. Pipeline Stage 2: Build Docker image
   ↓
6. Pipeline Stage 3: Run tests (if configured)
   ↓
7. Pipeline Stage 4: Push image to ECR
   ↓
8. Pipeline Stage 5: Update GitOps repo with new image tag
   ↓
9. ArgoCD: Detects GitOps repo change
   ↓
10. ArgoCD: Syncs application
   ↓
11. Kubernetes: Rolling update of pods
   ↓
12. Load Balancer: Routes traffic to new pods
   ↓
13. ✅ LIVE APP UPDATED!
```

**Duration**: 5-7 minutes total

---

## 🔧 **Troubleshooting**

### Jenkins job not triggering:
```powershell
# Check webhook deliveries
# GitHub → Settings → Webhooks → Click your webhook → Recent Deliveries

# Should show 200 OK responses
# If 404 or error, check Jenkins URL in webhook config
```

### Build failing:
```powershell
# Check Jenkins console output
# Jenkins → Job → Latest build → Console Output

# Common issues:
# - AWS credentials not configured
# - GitHub token not configured
# - kubectl not configured (need to add kubeconfig)
```

### ArgoCD not syncing:
```powershell
# Force manual sync
kubectl -n argocd patch application autostack-backend \
  --type merge -p '{"operation":{"sync":{"revision":"HEAD"}}}'

# Check ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```

### Pods not updating:
```powershell
# Check deployment status
kubectl rollout status deployment/autostack-backend -n default

# Check pod events
kubectl describe pod -l app.kubernetes.io/name=autostack-backend -n default

# Force restart
kubectl rollout restart deployment/autostack-backend -n default
```

---

## 🎉 **Success Criteria**

You know it's working when:

- ✅ Git push triggers Jenkins build automatically
- ✅ Jenkins build completes successfully
- ✅ New Docker image appears in ECR
- ✅ ArgoCD shows "Synced" status
- ✅ New pods roll out on EKS
- ✅ Live app updates with your changes
- ✅ Zero downtime during deployment

---

## 🚀 **You Now Have**

```
✅ Full production infrastructure on AWS
✅ Apps live on public internet
✅ One-click deployment (git push = deploy!)
✅ Zero-downtime rolling updates
✅ Automatic Docker image builds
✅ GitOps-based deployment tracking
✅ Complete CI/CD pipeline
✅ Production-grade platform
```

**This is what companies spend months building!** 💪

---

## 📚 **Next Steps**

1. **Add tests** to Jenkinsfile (unit tests, integration tests)
2. **Add notifications** (Slack/Discord webhooks)
3. **Add approval gates** (manual approval before production)
4. **Enable monitoring** (Prometheus + Grafana)
5. **Add custom domain** (Route53 + CNAME)
6. **Enable HTTPS** (ACM certificate + ALB)
7. **Add staging environment** (separate namespace)
8. **Blue-green deployments** (Flagger + Istio)

---

## 🔥 **You Did It!**

You now have a **production-grade, enterprise-level DevOps platform** with:
- Kubernetes orchestration
- GitOps deployments
- CI/CD automation
- Public internet access
- Auto-scaling
- Zero-downtime updates

**Start shipping features!** 🚀
