# 🚀 Quick Start - CI/CD Pipeline

**One-Click Deployment: GitHub → Jenkins → ECR → ArgoCD → EKS**

---

## ⚡ Quick Setup (5 Minutes)

### 1. Run Setup Script
```powershell
.\setup-jenkins-cicd.ps1
```

### 2. Test Deployment
```bash
# Make any code change
echo "// test" >> autostack-backend/backend/main.py

# Commit and push
git add .
git commit -m "test: trigger CI/CD"
git push origin main

# Watch magic happen! ✨
```

---

## 📊 Monitor Deployment

### Jenkins Build
```
http://65.2.39.10:8080
```

### ArgoCD Sync
```powershell
kubectl get applications -n argocd
kubectl port-forward svc/argocd-server -n argocd 8080:80
# http://localhost:8080
```

### Pod Status
```powershell
kubectl get pods -n default -w
```

---

## 🔄 Deployment Flow

```
┌─────────────┐
│ Git Push    │
│ to GitHub   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ GitHub      │
│ Webhook     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Jenkins     │
│ Build       │ ← Runs Jenkinsfile.backend/frontend
└──────┬──────┘
       │
       ├─────► Docker Build
       │
       ├─────► Push to ECR
       │
       ├─────► Update GitOps Repo
       │
       ▼
┌─────────────┐
│ ArgoCD      │
│ Auto-Sync   │ ← Detects GitOps change
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ EKS Deploy  │
│ Rolling     │ ← Zero-downtime rollout
│ Update      │
└─────────────┘
```

---

## 🎯 What Gets Automated

### On Every Git Push:

✅ **Build**
- Docker image built with latest code
- Tagged with build number & git commit

✅ **Test** (optional)
- Unit tests run in container
- Security scanning with Trivy

✅ **Deploy**
- Image pushed to ECR
- GitOps repo updated
- ArgoCD syncs automatically

✅ **Verify**
- Health checks pass
- Pods rollout successfully
- Smoke tests run

---

## 🛠️ Customization

### Add Tests
Edit `Jenkinsfile.backend` stage 'Run Tests':
```groovy
stage('Run Tests') {
    steps {
        sh """
            cd autostack-backend/backend
            docker run --rm ${ECR_REPO}:${IMAGE_TAG} pytest tests/
        """
    }
}
```

### Add Notifications
Edit `post` section:
```groovy
post {
    success {
        slackSend(
            color: 'good',
            message: "✅ Backend deployed: ${IMAGE_TAG}"
        )
    }
}
```

### Add Approval Step
Add before 'Trigger ArgoCD Sync':
```groovy
stage('Manual Approval') {
    steps {
        input message: 'Deploy to production?', ok: 'Deploy!'
    }
}
```

---

## 🔍 Troubleshooting

### Build Fails
```bash
# Check Jenkins logs
http://65.2.39.10:8080/job/autostack-backend-deploy/lastBuild/console

# Check Docker build
docker build -t test ./autostack-backend/backend
```

### ArgoCD Not Syncing
```bash
# Check ArgoCD app status
kubectl describe application autostack-backend -n argocd

# Force manual sync
kubectl -n argocd patch application autostack-backend \
  --type merge -p '{"operation":{"sync":{"revision":"HEAD"}}}'
```

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod -n default -l app.kubernetes.io/name=autostack-backend

# Check image pull
kubectl get events -n default --sort-by='.lastTimestamp'

# Verify ECR image exists
aws ecr list-images --repository-name autostack-backend --region ap-south-1
```

---

## 📈 Deployment Metrics

Track these in Jenkins:
- **Build Duration**: Target < 5 minutes
- **Success Rate**: Target > 95%
- **Deployment Frequency**: Multiple per day
- **Lead Time**: Push to production < 10 minutes

---

## 🎓 Best Practices

### 1. Branch Protection
```bash
# Only deploy from main branch
# Use feature branches for development
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature
# Create PR → Review → Merge → Auto-deploy
```

### 2. Rollback Strategy
```bash
# If deployment fails, rollback via ArgoCD
kubectl -n argocd patch application autostack-backend \
  --type merge -p '{"spec":{"source":{"targetRevision":"PREVIOUS_COMMIT"}}}'
```

### 3. Environment Strategy
```bash
# Use different namespaces for environments
- Development: default
- Staging: staging
- Production: production

# Use different ArgoCD apps per environment
```

---

## 💡 Next Level Features

### Blue-Green Deployment
```yaml
# In Argocd app
spec:
  syncPolicy:
    automated:
      prune: false  # Keep old version
  
  # Use Kubernetes traffic splitting
```

### Canary Deployment with Flagger
```bash
helm install flagger flagger/flagger \
  --namespace flagger-system \
  --set meshProvider=nginx
```

### Automated Rollback
```groovy
// In Jenkinsfile
stage('Verify Deployment') {
    steps {
        script {
            def health = sh(
                script: 'curl -s http://backend/health',
                returnStdout: true
            )
            if (!health.contains('ok')) {
                error('Health check failed - rolling back')
            }
        }
    }
}
```

---

## ✅ Success Criteria

Your CI/CD is working when:

- ✅ Git push triggers build automatically
- ✅ Build completes in < 5 minutes
- ✅ Image pushed to ECR successfully
- ✅ ArgoCD syncs within 30 seconds
- ✅ Pods rollout without downtime
- ✅ Health checks pass
- ✅ No manual intervention needed

---

## 🎉 You Did It!

**You now have production-grade CI/CD:**
- Fully automated deployments
- Zero-downtime rollouts
- Git-based deployment history
- Automatic rollback capability
- Observable with ArgoCD UI

**Ship code faster. Deploy with confidence.** 🚀

---

**Need help?**
- Jenkins: http://65.2.39.10:8080
- ArgoCD: http://localhost:8080 (port-forward)
- Docs: `docs/03-POST-DEPLOYMENT-GUIDE.md`
