# Setup One-Click Deployment
# Complete CI/CD automation: Git Push → Auto Deploy to Live Internet

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 One-Click Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Jenkins is accessible
Write-Host "Checking Jenkins..." -ForegroundColor Yellow
$jenkinsUrl = "http://65.2.39.10:8080"

try {
    $response = Invoke-WebRequest -Uri $jenkinsUrl -TimeoutSec 5 -UseBasicParsing
    Write-Host "[OK] Jenkins is running at $jenkinsUrl" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Cannot reach Jenkins at $jenkinsUrl" -ForegroundColor Red
    Write-Host "Make sure Jenkins EC2 instance is running:" -ForegroundColor Yellow
    Write-Host "  aws ec2 describe-instances --filters 'Name=tag:Name,Values=*jenkins*' --region ap-south-1" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 Step 1: Install Jenkins Plugins" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Open Jenkins in browser:" -ForegroundColor Yellow
Write-Host "  $jenkinsUrl" -ForegroundColor Cyan
Write-Host ""

Write-Host "Install these plugins:" -ForegroundColor White
$plugins = @(
    "Docker Pipeline",
    "Git Plugin",
    "GitHub Plugin", 
    "AWS Steps",
    "Kubernetes CLI Plugin",
    "Pipeline: Stage View",
    "Credentials Binding Plugin"
)

foreach ($plugin in $plugins) {
    Write-Host "  ✓ $plugin" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Installation steps:" -ForegroundColor Yellow
Write-Host "  1. Go to: $jenkinsUrl/pluginManager/available" -ForegroundColor White
Write-Host "  2. Search for each plugin above" -ForegroundColor White
Write-Host "  3. Check the box next to each" -ForegroundColor White
Write-Host "  4. Click 'Install without restart'" -ForegroundColor White
Write-Host "  5. Wait for installation to complete" -ForegroundColor White
Write-Host ""

$installed = Read-Host "Plugins installed? (y/n)"
if ($installed -ne "y") {
    Write-Host "Please install plugins first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔑 Step 2: Add AWS Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Add AWS credentials to Jenkins:" -ForegroundColor Yellow
Write-Host "  1. Go to: $jenkinsUrl/credentials/store/system/domain/_/newCredentials" -ForegroundColor White
Write-Host "  2. Kind: AWS Credentials" -ForegroundColor White
Write-Host "  3. ID: aws-credentials" -ForegroundColor White
Write-Host "  4. Description: AWS credentials for ECR and EKS" -ForegroundColor White
Write-Host "  5. Access Key ID: <your-aws-access-key>" -ForegroundColor White
Write-Host "  6. Secret Access Key: <your-aws-secret-key>" -ForegroundColor White
Write-Host "  7. Click 'Create'" -ForegroundColor White
Write-Host ""

$awsKey = Read-Host "Enter your AWS Access Key ID (or 'skip' if already configured)"
if ($awsKey -ne "skip") {
    Write-Host ""
    Write-Host "⚠️  Add this manually in Jenkins UI at the URL above" -ForegroundColor Yellow
    Write-Host "    Access Key ID: $awsKey" -ForegroundColor Gray
    Write-Host ""
}

$awsCreds = Read-Host "AWS credentials added? (y/n)"
if ($awsCreds -ne "y") {
    Write-Host "Please add AWS credentials first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔑 Step 3: Add GitHub Token" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Create GitHub Personal Access Token:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://github.com/settings/tokens/new" -ForegroundColor White
Write-Host "  2. Note: Jenkins CI/CD Token" -ForegroundColor White
Write-Host "  3. Expiration: No expiration (or 1 year)" -ForegroundColor White
Write-Host "  4. Scopes: Check 'repo', 'workflow', 'write:packages'" -ForegroundColor White
Write-Host "  5. Click 'Generate token'" -ForegroundColor White
Write-Host "  6. Copy the token (you won't see it again!)" -ForegroundColor White
Write-Host ""

Start-Process "https://github.com/settings/tokens/new"
Start-Sleep -Seconds 2

$githubToken = Read-Host "Enter your GitHub token (or 'skip')"
if ($githubToken -ne "skip") {
    Write-Host ""
    Write-Host "Add to Jenkins:" -ForegroundColor Yellow
    Write-Host "  1. Go to: $jenkinsUrl/credentials/store/system/domain/_/newCredentials" -ForegroundColor White
    Write-Host "  2. Kind: Secret text" -ForegroundColor White
    Write-Host "  3. ID: github-token" -ForegroundColor White
    Write-Host "  4. Secret: $githubToken" -ForegroundColor White
    Write-Host "  5. Description: GitHub token for repo access" -ForegroundColor White
    Write-Host "  6. Click 'Create'" -ForegroundColor White
    Write-Host ""
}

$ghCreds = Read-Host "GitHub token added? (y/n)"
if ($ghCreds -ne "y") {
    Write-Host "Please add GitHub token first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🏗️  Step 4: Create Jenkins Jobs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating Backend Pipeline Job..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual steps:" -ForegroundColor Yellow
Write-Host "  1. Go to: $jenkinsUrl/view/all/newJob" -ForegroundColor White
Write-Host "  2. Name: autostack-backend-deploy" -ForegroundColor Cyan
Write-Host "  3. Type: Pipeline" -ForegroundColor White
Write-Host "  4. Click OK" -ForegroundColor White
Write-Host ""
Write-Host "  5. Under 'Pipeline' section:" -ForegroundColor White
Write-Host "     - Definition: Pipeline script from SCM" -ForegroundColor Gray
Write-Host "     - SCM: Git" -ForegroundColor Gray
Write-Host "     - Repository URL: https://github.com/Raj-glitch-max/auto-stack-deploy.git" -ForegroundColor Gray
Write-Host "     - Branch Specifier: */main" -ForegroundColor Gray
Write-Host "     - Script Path: Jenkinsfile.backend" -ForegroundColor Gray
Write-Host ""
Write-Host "  6. Under 'Build Triggers':" -ForegroundColor White
Write-Host "     - ✓ GitHub hook trigger for GITScm polling" -ForegroundColor Gray
Write-Host ""
Write-Host "  7. Click 'Save'" -ForegroundColor White
Write-Host ""

Start-Process "$jenkinsUrl/view/all/newJob"

$backendJob = Read-Host "Backend job created? (y/n)"

Write-Host ""
Write-Host "Creating Frontend Pipeline Job..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Repeat above steps with:" -ForegroundColor White
Write-Host "     - Name: autostack-frontend-deploy" -ForegroundColor Cyan
Write-Host "     - Script Path: Jenkinsfile.frontend" -ForegroundColor Gray
Write-Host ""

$frontendJob = Read-Host "Frontend job created? (y/n)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔗 Step 5: Configure GitHub Webhook" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Setting up webhook for auto-deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual steps:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://github.com/Raj-glitch-max/auto-stack-deploy/settings/hooks/new" -ForegroundColor White
Write-Host "  2. Payload URL: $jenkinsUrl/github-webhook/" -ForegroundColor Cyan
Write-Host "  3. Content type: application/json" -ForegroundColor White
Write-Host "  4. Which events: Just the push event" -ForegroundColor White
Write-Host "  5. Active: ✓ (checked)" -ForegroundColor White
Write-Host "  6. Click 'Add webhook'" -ForegroundColor White
Write-Host ""

Start-Process "https://github.com/Raj-glitch-max/auto-stack-deploy/settings/hooks/new"

$webhook = Read-Host "Webhook configured? (y/n)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Testing one-click deployment..." -ForegroundColor Yellow
Write-Host ""

$test = Read-Host "Do you want to test deploy now? (y/n)"
if ($test -eq "y") {
    Write-Host ""
    Write-Host "Creating test commit to trigger deployment..." -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $testContent = @"
# One-Click Deploy Test

Triggered at: $timestamp

This commit will automatically:
1. Trigger Jenkins build
2. Build Docker images
3. Push to ECR
4. Update GitOps repo
5. ArgoCD auto-sync
6. Deploy to EKS
7. Update live apps on internet!

Status: Testing...
"@
    
    $testContent | Out-File -FilePath "DEPLOYMENT-TEST.md" -Encoding UTF8
    
    git add .
    git commit -m "test: One-click deployment test - $timestamp"
    
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push origin main
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "🚀 DEPLOYMENT TRIGGERED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Watch the magic happen:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Jenkins Build (2-3 min):" -ForegroundColor Yellow
    Write-Host "   $jenkinsUrl/job/autostack-backend-deploy/" -ForegroundColor White
    Write-Host ""
    
    Write-Host "2. ArgoCD Sync (30 sec):" -ForegroundColor Yellow
    Write-Host "   kubectl get applications -n argocd -w" -ForegroundColor White
    Write-Host ""
    
    Write-Host "3. Pod Rollout (1-2 min):" -ForegroundColor Yellow
    Write-Host "   kubectl get pods -n default -w" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Total time: ~5 minutes from push to live!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Opening Jenkins..." -ForegroundColor Cyan
    Start-Process "$jenkinsUrl/job/autostack-backend-deploy/"
    
    Write-Host ""
    $monitor = Read-Host "Monitor deployment in terminal? (y/n)"
    if ($monitor -eq "y") {
        Write-Host ""
        Write-Host "Monitoring ArgoCD applications..." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        
        kubectl get applications -n argocd -w
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ONE-CLICK DEPLOYMENT READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 How to deploy now:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make any code change" -ForegroundColor White
Write-Host "2. git add ." -ForegroundColor Gray
Write-Host "3. git commit -m 'your message'" -ForegroundColor Gray
Write-Host "4. git push origin main" -ForegroundColor Gray
Write-Host "5. Watch it auto-deploy to production! 🚀" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Monitor:" -ForegroundColor Cyan
Write-Host "  Jenkins:  $jenkinsUrl" -ForegroundColor White
Write-Host "  ArgoCD:   kubectl port-forward svc/argocd-server -n argocd 8080:80" -ForegroundColor White
Write-Host "  Apps:     See PUBLIC-URLS.txt" -ForegroundColor White
Write-Host ""

Write-Host "🎉 You now have LIVE auto-deployment!" -ForegroundColor Green
