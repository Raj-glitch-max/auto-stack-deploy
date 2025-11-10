# Cleanup failed Prometheus release and retry with webhook wait

Write-Host "[INFO] Cleaning up failed Prometheus release..." -ForegroundColor Yellow

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

# Uninstall failed Prometheus release
Write-Host "[INFO] Uninstalling Prometheus..." -ForegroundColor Gray
helm uninstall prometheus -n monitoring 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Prometheus uninstalled" -ForegroundColor Green
} else {
    Write-Host "[WARN] Prometheus may not exist (continuing anyway)" -ForegroundColor Yellow
}

# Clean up any pending Helm secrets
Write-Host "[INFO] Cleaning up pending Helm secrets..." -ForegroundColor Gray
kubectl delete secrets -n kube-system -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n kube-system -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n monitoring -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n monitoring -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null

Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Show what changed
Write-Host "[INFO] Changes in this deployment:" -ForegroundColor Cyan
Write-Host "  - Added null_resource to wait for ALB webhook to be ready" -ForegroundColor White
Write-Host "  - ArgoCD and Prometheus now depend on webhook wait resource" -ForegroundColor White
Write-Host "  - Webhook wait script checks for endpoints and waits 30 seconds" -ForegroundColor White
Write-Host ""

# Retry terraform
Write-Host "[DEPLOY] Retrying Terraform apply..." -ForegroundColor Cyan
Write-Host ""

terraform apply -auto-approve
