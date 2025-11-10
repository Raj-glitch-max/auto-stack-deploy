# Fix ArgoCD Applications Script
# This script deletes the failing applications and recreates them with correct configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix ArgoCD Applications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure kubectl
Write-Host "[1/4] Configuring kubectl..." -ForegroundColor Yellow
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] kubectl configured" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to configure kubectl" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Delete existing failing applications
Write-Host "[2/4] Deleting failing ArgoCD applications..." -ForegroundColor Yellow
kubectl delete application autostack-backend -n argocd --ignore-not-found=true
kubectl delete application autostack-frontend -n argocd --ignore-not-found=true
Write-Host "[OK] Old applications deleted" -ForegroundColor Green
Write-Host ""

# Wait a moment for cleanup
Write-Host "[3/4] Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "[OK] Ready to create new applications" -ForegroundColor Green
Write-Host ""

# Apply new application manifests
Write-Host "[4/4] Creating new ArgoCD applications..." -ForegroundColor Yellow
kubectl apply -f infra/argocd/apps/backend-app.yaml
kubectl apply -f infra/argocd/apps/frontend-app.yaml
Write-Host "[OK] New applications created" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ArgoCD Applications:" -ForegroundColor White
kubectl get applications -n argocd
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "[SUCCESS] ArgoCD applications fixed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Refresh ArgoCD UI (http://localhost:8080)" -ForegroundColor White
Write-Host "2. Click SYNC on each application" -ForegroundColor White
Write-Host "3. Applications will deploy once you push Docker images to ECR" -ForegroundColor White
Write-Host ""

Write-Host "Note: Applications will show 'Missing' until Docker images are built and pushed to ECR" -ForegroundColor Cyan
Write-Host "ECR Repositories:" -ForegroundColor Cyan
Write-Host "  Backend:  367749063363.dkr.ecr.ap-south-1.amazonaws.com/autostack-backend" -ForegroundColor Gray
Write-Host "  Frontend: 367749063363.dkr.ecr.ap-south-1.amazonaws.com/autostack-frontend" -ForegroundColor Gray
