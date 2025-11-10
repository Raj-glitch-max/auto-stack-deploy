#!/usr/bin/env pwsh
# AutoStack - Fix Helm Webhook Issues and Retry Deployment
# This script cleans up failed Helm releases and retries Terraform apply

Write-Host "AutoStack - Helm Webhook Fix and Retry" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set AWS credentials
$env:AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY"
$env:AWS_REGION = "ap-south-1"

Write-Host "[OK] AWS credentials configured" -ForegroundColor Green
Write-Host ""

# Configure kubectl
Write-Host "[INFO] Configuring kubectl..." -ForegroundColor Yellow
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] kubectl configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] kubectl configuration failed (cluster may not be ready yet)" -ForegroundColor Yellow
}
Write-Host ""

# Check if cluster is accessible
Write-Host "[INFO] Checking cluster accessibility..." -ForegroundColor Yellow
$nodes = kubectl get nodes 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Cluster is accessible" -ForegroundColor Green
    Write-Host $nodes
} else {
    Write-Host "[WARN] Cannot access cluster yet" -ForegroundColor Yellow
}
Write-Host ""

# Clean up failed Prometheus release
Write-Host "[INFO] Cleaning up failed Helm releases..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Checking for failed Prometheus release..." -ForegroundColor Gray
$prometheusExists = helm list -n monitoring 2>&1 | Select-String "prometheus"
if ($prometheusExists) {
    Write-Host "  Found Prometheus release, uninstalling..." -ForegroundColor Gray
    helm uninstall prometheus -n monitoring 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Prometheus release removed" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Could not remove Prometheus (may not exist)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [INFO] No Prometheus release found" -ForegroundColor Gray
}
Write-Host ""

# Check ALB controller status
Write-Host "[INFO] Checking AWS Load Balancer Controller status..." -ForegroundColor Yellow
$albPods = kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host $albPods
    Write-Host ""
    
    # Wait for ALB controller to be ready
    Write-Host "[INFO] Waiting for ALB controller to be ready (max 5 minutes)..." -ForegroundColor Yellow
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aws-load-balancer-controller -n kube-system --timeout=300s 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] ALB controller is ready" -ForegroundColor Green
    } else {
        Write-Host "[WARN] ALB controller not ready yet (will retry anyway)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] ALB controller not found (will be created)" -ForegroundColor Yellow
}
Write-Host ""

# Validate Terraform configuration
Write-Host "[INFO] Validating Terraform configuration..." -ForegroundColor Yellow
terraform validate
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Terraform configuration is valid" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Terraform validation failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Retry Terraform apply
Write-Host "[DEPLOY] Retrying Terraform apply..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will deploy/update:" -ForegroundColor White
Write-Host "  - AWS Load Balancer Controller (with proper wait)" -ForegroundColor Gray
Write-Host "  - ArgoCD (after ALB controller is ready)" -ForegroundColor Gray
Write-Host "  - Prometheus + Grafana (after ALB controller is ready)" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected time: 12-18 minutes" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date

terraform apply -auto-approve

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Deployment completed successfully!" -ForegroundColor Green
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    
    # Show outputs
    Write-Host "[OUTPUTS] Deployment Outputs:" -ForegroundColor Cyan
    Write-Host ""
    terraform output
    
    Write-Host ""
    Write-Host "[NEXT] Next Steps:" -ForegroundColor Green
    Write-Host "  1. Get service URLs:" -ForegroundColor White
    Write-Host "     kubectl get svc -n argocd argocd-server" -ForegroundColor Gray
    Write-Host "     kubectl get svc -n monitoring prometheus-grafana" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Get ArgoCD password:" -ForegroundColor White
    Write-Host "     kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Deploy AutoStack apps:" -ForegroundColor White
    Write-Host "     kubectl apply -f ../argocd/apps/root.yaml" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[TROUBLESHOOT] Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Terraform error messages above" -ForegroundColor White
    Write-Host "  2. Check pod status: kubectl get pods -A" -ForegroundColor Gray
    Write-Host "  3. Check ALB controller logs:" -ForegroundColor White
    Write-Host "     kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
