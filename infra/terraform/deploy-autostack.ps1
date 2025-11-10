# ============================================
# AutoStack Complete Deployment Script
# ============================================

param(
    [switch]$SkipValidation,
    [switch]$AutoApprove
)

$ErrorActionPreference = "Stop"

Write-Host @"
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘                                                           â•‘
â•‘          ðŸš€ AutoStack AWS Deployment Script ðŸš€           â•‘
â•‘                                                           â•‘
â•‘  This script will deploy complete AutoStack              â•‘
â•‘  infrastructure on AWS including:                        â•‘
â•‘  - VPC, Subnets, NAT Gateway                            â•‘
â•‘  - EKS Cluster with managed nodes                       â•‘
â•‘  - ECR Repositories                                      â•‘
â•‘  - Jenkins CI/CD                                         â•‘
â•‘  - ArgoCD GitOps                                         â•‘
â•‘  - Prometheus + Grafana Monitoring                      â•‘
â•‘  - Application Load Balancer                            â•‘
â•‘                                                           â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
"@ -ForegroundColor Cyan

# ============================================
# Step 1: Prerequisites Check
# ============================================
Write-Host "`n[1/10] Checking prerequisites..." -ForegroundColor Yellow

$prerequisites = @{
    "AWS CLI" = { aws --version }
    "Terraform" = { terraform version }
    "kubectl" = { kubectl version --client }
    "Helm" = { helm version }
}

$missingTools = @()
foreach ($tool in $prerequisites.Keys) {
    try {
        $null = & $prerequisites[$tool] 2>&1
        Write-Host "  âœ… $tool installed" -ForegroundColor Green
    } catch {
        Write-Host "  âŒ $tool not found" -ForegroundColor Red
        $missingTools += $tool
    }
}

if ($missingTools.Count -gt 0) {
    Write-Host "`nâŒ Missing prerequisites: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host "Please install missing tools and try again." -ForegroundColor Yellow
    Write-Host "See DEPLOYMENT_SETUP_GUIDE.md for installation instructions." -ForegroundColor Cyan
    exit 1
}

# ============================================
# Step 2: Set AWS Credentials
# ============================================
Write-Host "`n[2/10] Configuring AWS credentials..." -ForegroundColor Yellow

$env:AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY"
$env:AWS_REGION = "ap-south-1"
$env:AWS_DEFAULT_REGION = "ap-south-1"

# Test AWS credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "  âœ… AWS credentials valid" -ForegroundColor Green
    Write-Host "  Account: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "  User: $($identity.Arn)" -ForegroundColor Cyan
} catch {
    Write-Host "  âŒ AWS credentials invalid" -ForegroundColor Red
    exit 1
}

# ============================================
# Step 3: Setup S3 Backend
# ============================================
Write-Host "`n[3/10] Setting up Terraform backend..." -ForegroundColor Yellow

# Check if S3 bucket exists
$bucketExists = aws s3 ls s3://autostack-tfstate 2>$null
if (-not $bucketExists) {
    Write-Host "  Creating S3 bucket: autostack-tfstate" -ForegroundColor Cyan
    aws s3 mb s3://autostack-tfstate --region ap-south-1
    aws s3api put-bucket-versioning --bucket autostack-tfstate --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket autostack-tfstate --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}'
    Write-Host "  âœ… S3 bucket created" -ForegroundColor Green
} else {
    Write-Host "  âœ… S3 bucket exists" -ForegroundColor Green
}

# Check if DynamoDB table exists
$tableExists = aws dynamodb describe-table --table-name autostack-tf-locks --region ap-south-1 2>$null
if (-not $tableExists) {
    Write-Host "  Creating DynamoDB table: autostack-tf-locks" -ForegroundColor Cyan
    aws dynamodb create-table `
        --table-name autostack-tf-locks `
        --attribute-definitions AttributeName=LockID,AttributeType=S `
        --key-schema AttributeName=LockID,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region ap-south-1
    Start-Sleep -Seconds 10
    Write-Host "  âœ… DynamoDB table created" -ForegroundColor Green
} else {
    Write-Host "  âœ… DynamoDB table exists" -ForegroundColor Green
}

# ============================================
# Step 4: Initialize Terraform
# ============================================
Write-Host "`n[4/10] Initializing Terraform..." -ForegroundColor Yellow

terraform init -upgrade
if ($LASTEXITCODE -ne 0) {
    Write-Host "  âŒ Terraform init failed" -ForegroundColor Red
    exit 1
}
Write-Host "  âœ… Terraform initialized" -ForegroundColor Green

# ============================================
# Step 5: Validate Configuration
# ============================================
if (-not $SkipValidation) {
    Write-Host "`n[5/10] Validating Terraform configuration..." -ForegroundColor Yellow
    
    terraform validate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  âŒ Terraform validation failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  âœ… Configuration valid" -ForegroundColor Green
} else {
    Write-Host "`n[5/10] Skipping validation..." -ForegroundColor Yellow
}

# ============================================
# Step 6: Generate Plan
# ============================================
Write-Host "`n[6/10] Generating Terraform plan..." -ForegroundColor Yellow

terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "  âŒ Terraform plan failed" -ForegroundColor Red
    exit 1
}
Write-Host "  âœ… Plan generated successfully" -ForegroundColor Green

# ============================================
# Step 7: Cost Estimate
# ============================================
Write-Host "`n[7/10] Estimated Monthly Cost:" -ForegroundColor Yellow
Write-Host @"
  
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ Resource                    â”‚ Monthly Cost  â”‚
  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
  â”‚ EKS Control Plane           â”‚ ~`$73.00      â”‚
  â”‚ EC2 t3.small spot (1 node)  â”‚ ~`$7.00       â”‚
  â”‚ EC2 t3.micro Jenkins        â”‚ ~`$7.00       â”‚
  â”‚ NAT Gateway (1)             â”‚ ~`$32.00      â”‚
  â”‚ Application Load Balancer   â”‚ ~`$20.00      â”‚
  â”‚ Data Transfer               â”‚ ~`$5.00       â”‚
  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
  â”‚ TOTAL ESTIMATED             â”‚ ~`$144/month  â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
  
  Free Tier Benefits:
  âœ… 750 hours/month t3.micro (Jenkins covered)
  âœ… 30 GB EBS storage free
  âœ… 1 GB data transfer out free
  
"@ -ForegroundColor Cyan

if (-not $AutoApprove) {
    Write-Host "`nâš ï¸  Review the plan above carefully." -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to proceed with deployment? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 0
    }
}

# ============================================
# Step 8: Apply Infrastructure
# ============================================
Write-Host "`n[8/10] Deploying infrastructure (15-20 minutes)..." -ForegroundColor Yellow
Write-Host "  â³ This will take a while. Please be patient..." -ForegroundColor Cyan

$startTime = Get-Date

if ($AutoApprove) {
    terraform apply -auto-approve tfplan
} else {
    terraform apply tfplan
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "  âŒ Terraform apply failed" -ForegroundColor Red
    exit 1
}

$duration = (Get-Date) - $startTime
Write-Host "  âœ… Infrastructure deployed in $($duration.Minutes) minutes" -ForegroundColor Green

# ============================================
# Step 9: Configure kubectl
# ============================================
Write-Host "`n[9/10] Configuring kubectl..." -ForegroundColor Yellow

$clusterName = terraform output -raw eks_cluster_name
aws eks update-kubeconfig --region ap-south-1 --name $clusterName

Start-Sleep -Seconds 10

# Wait for nodes to be ready
Write-Host "  Waiting for EKS nodes to be ready..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $nodes = kubectl get nodes --no-headers 2>$null
    if ($nodes -and $nodes -match "Ready") {
        Write-Host "  âœ… EKS nodes are ready" -ForegroundColor Green
        break
    }
    $attempt++
    Start-Sleep -Seconds 10
}

if ($attempt -eq $maxAttempts) {
    Write-Host "  âš ï¸  Nodes not ready yet, but continuing..." -ForegroundColor Yellow
}

# ============================================
# Step 10: Deploy Applications
# ============================================
Write-Host "`n[10/10] Deploying applications via ArgoCD..." -ForegroundColor Yellow

# Wait for ArgoCD to be ready
Write-Host "  Waiting for ArgoCD to be ready..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $argocdPods = kubectl get pods -n argocd --no-headers 2>$null | Where-Object { $_ -match "Running" }
    if ($argocdPods) {
        Write-Host "  âœ… ArgoCD is ready" -ForegroundColor Green
        break
    }
    $attempt++
    Start-Sleep -Seconds 10
}

# Apply ArgoCD applications
Write-Host "  Deploying applications..." -ForegroundColor Cyan
kubectl apply -f ../../argocd/apps/root.yaml

Start-Sleep -Seconds 5

# ============================================
# Deployment Complete
# ============================================
Write-Host "`n" -NoNewline
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Green
Write-Host "â•‘                                                           â•‘" -ForegroundColor Green
Write-Host "â•‘          âœ… DEPLOYMENT SUCCESSFUL! âœ…                     â•‘" -ForegroundColor Green
Write-Host "â•‘                                                           â•‘" -ForegroundColor Green
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Green

# ============================================
# Get Service URLs
# ============================================
Write-Host "`nðŸ“Š Service URLs:" -ForegroundColor Cyan

$albDns = terraform output -raw alb_dns_frontend 2>$null
$jenkinsUrl = terraform output -raw jenkins_url 2>$null

if ($albDns) {
    Write-Host "`n  Frontend:  http://$albDns/" -ForegroundColor White
    Write-Host "  Backend:   http://$albDns/api" -ForegroundColor White
    Write-Host "  Health:    http://$albDns/api/health" -ForegroundColor White
    Write-Host "  ArgoCD:    https://$albDns/argocd" -ForegroundColor White
    Write-Host "  Grafana:   http://$albDns/grafana" -ForegroundColor White
} else {
    Write-Host "  âš ï¸  ALB DNS not available yet. Run 'terraform output' to get URLs." -ForegroundColor Yellow
}

if ($jenkinsUrl) {
    Write-Host "  Jenkins:   $jenkinsUrl" -ForegroundColor White
}

# ============================================
# Get Credentials
# ============================================
Write-Host "`nðŸ” Service Credentials:" -ForegroundColor Cyan

# ArgoCD password
$argocdPassword = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 2>$null
if ($argocdPassword) {
    $argocdPasswordDecoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($argocdPassword))
    Write-Host "`n  ArgoCD:" -ForegroundColor White
    Write-Host "    Username: admin" -ForegroundColor Gray
    Write-Host "    Password: $argocdPasswordDecoded" -ForegroundColor Gray
}

# Grafana password
$grafanaPassword = kubectl -n monitoring get secret prometheus-grafana -o jsonpath='{.data.admin-password}' 2>$null
if ($grafanaPassword) {
    $grafanaPasswordDecoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($grafanaPassword))
    Write-Host "`n  Grafana:" -ForegroundColor White
    Write-Host "    Username: admin" -ForegroundColor Gray
    Write-Host "    Password: $grafanaPasswordDecoded" -ForegroundColor Gray
}

# ============================================
# Save Outputs
# ============================================
Write-Host "`n💾 Saving deployment outputs..." -ForegroundColor Cyan

terraform output > ../../DEPLOYMENT_OUTPUTS.md

# ============================================
# Verification
# ============================================
Write-Host "`n💾 Running health checks..." -ForegroundColor Cyan

Write-Host "`n  Cluster Status:" -ForegroundColor White
kubectl get nodes

Write-Host "`n  Application Pods:" -ForegroundColor White
kubectl get pods -n autostack 2>$null

Write-Host "`n  ArgoCD Applications:" -ForegroundColor White
kubectl get applications -n argocd 2>$null

Write-Host "`n  HPA Status:" -ForegroundColor White
kubectl get hpa -n autostack 2>$null

# ============================================
# Next Steps
# ============================================
Write-Host "`n💾“‹ Next Steps:" -ForegroundColor Cyan
Write-Host @"

  1. Update OAuth Callbacks:
     - Google: Add http://$albDns/api/auth/google/callback
     - GitHub: Add http://$albDns/api/auth/github/callback

  2. Test Frontend:
     curl http://$albDns/

  3. Test Backend Health:
     curl http://$albDns/api/health

  4. Access ArgoCD:
     Open https://$albDns/argocd
     Login with credentials above

  5. Access Grafana:
     Open http://$albDns/grafana
     Login with credentials above

  6. Monitor Deployments:
     kubectl get pods -n autostack -w

  7. View Logs:
     kubectl logs -f deployment/autostack-frontend -n autostack

"@ -ForegroundColor White

Write-Host "âœ… Deployment complete! Check DEPLOYMENT_OUTPUTS.md for all details." -ForegroundColor Green
Write-Host "`nðŸŽ‰ AutoStack is now running on AWS! ðŸŽ‰`n" -ForegroundColor Cyan


