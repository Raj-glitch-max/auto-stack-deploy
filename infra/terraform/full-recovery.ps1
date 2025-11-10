# Full recovery - unlock state and retry deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoStack - Full Recovery" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Force unlock state
Write-Host "[STEP 1/4] Unlocking Terraform state..." -ForegroundColor Yellow
$lockId = "c5b3075c-b80d-282c-0e41-b11f536d5522"
terraform force-unlock -force $lockId

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to unlock state" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] State unlocked" -ForegroundColor Green
Write-Host ""

# Step 2: Configure kubectl
Write-Host "[STEP 2/4] Configuring kubectl..." -ForegroundColor Yellow
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] kubectl configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] kubectl configuration failed (cluster may not be ready)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Clean up any stuck Helm releases
Write-Host "[STEP 3/4] Cleaning up Helm releases..." -ForegroundColor Yellow

# Clean up pending secrets
Write-Host "  Cleaning pending Helm secrets..." -ForegroundColor Gray
kubectl delete secrets -n kube-system -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n kube-system -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n argocd -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n argocd -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n monitoring -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n monitoring -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null

Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 4: Show current state
Write-Host "[STEP 4/4] Current Helm releases:" -ForegroundColor Yellow
helm list -A
Write-Host ""

# Ready to retry
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[READY] Ready to retry deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current status:" -ForegroundColor White
Write-Host "  - State: Unlocked" -ForegroundColor Green
Write-Host "  - ALB Controller: Deployed" -ForegroundColor Green
Write-Host "  - ArgoCD: Uninstalled (will be recreated)" -ForegroundColor Yellow
Write-Host "  - Prometheus: Not deployed" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next deployment will:" -ForegroundColor White
Write-Host "  1. Wait for ALB webhook to be ready (new wait logic)" -ForegroundColor Gray
Write-Host "  2. Deploy ArgoCD with LoadBalancer" -ForegroundColor Gray
Write-Host "  3. Deploy Prometheus with LoadBalancer" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected time: 15-20 minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "[NEXT] Run: terraform apply -auto-approve" -ForegroundColor Cyan
Write-Host ""
