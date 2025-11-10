# Simple Fix - Remove and Recreate Failed Resources

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoStack - Simple Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

Write-Host "[STEP 1/4] Removing failed resources from Terraform state..." -ForegroundColor Yellow
terraform state rm module.k8s_addons.helm_release.argocd
terraform state rm module.k8s_addons.helm_release.kube_prometheus_stack
Write-Host "[OK] Resources removed from state" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 2/4] Cleaning up Kubernetes resources..." -ForegroundColor Yellow
kubectl delete namespace argocd --ignore-not-found=true --timeout=60s 2>&1 | Out-Null
kubectl delete namespace monitoring --ignore-not-found=true --timeout=60s 2>&1 | Out-Null
Write-Host "[OK] Namespaces deleted" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 3/4] Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 4/4] Deploying fresh resources..." -ForegroundColor Yellow
Write-Host ""

terraform apply -auto-approve

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[SUCCESS] Deployment completed!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Helm Releases:" -ForegroundColor White
    helm list -A
    Write-Host ""
    
    Write-Host "Services:" -ForegroundColor White
    kubectl get svc -n argocd argocd-server
    kubectl get svc -n monitoring prometheus-grafana
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    exit 1
}
