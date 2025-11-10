# Final Working Deployment - NodePort Solution

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoStack - Final Working Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

Write-Host "[STEP 1/4] Cleaning up failed releases..." -ForegroundColor Yellow
helm uninstall argocd -n argocd --wait 2>&1 | Out-Null
helm uninstall prometheus -n monitoring --wait 2>&1 | Out-Null
kubectl delete namespace argocd --ignore-not-found=true 2>&1 | Out-Null
kubectl delete namespace monitoring --ignore-not-found=true 2>&1 | Out-Null
Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 2/4] Removing from Terraform state..." -ForegroundColor Yellow
terraform state rm module.k8s_addons.helm_release.argocd 2>&1 | Out-Null
terraform state rm module.k8s_addons.helm_release.kube_prometheus_stack 2>&1 | Out-Null
terraform state rm module.k8s_addons.kubernetes_namespace.argocd 2>&1 | Out-Null
terraform state rm module.k8s_addons.kubernetes_namespace.monitoring 2>&1 | Out-Null
Write-Host "[OK] State cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 3/4] Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "[OK] Ready to deploy" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 4/4] Deploying with NodePort (NO LoadBalancer)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Changes:" -ForegroundColor White
Write-Host "  - ArgoCD: NodePort (no ALB needed)" -ForegroundColor Gray
Write-Host "  - Grafana: NodePort (no ALB needed)" -ForegroundColor Gray
Write-Host "  - Prometheus: NodePort (no ALB needed)" -ForegroundColor Gray
Write-Host "  - Reduced timeouts: 5-10 minutes total" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected time: 5-10 minutes" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

terraform apply -auto-approve

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Deployment completed!" -ForegroundColor Green
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[VERIFY] Checking status..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Helm Releases:" -ForegroundColor White
    helm list -A
    Write-Host ""
    
    Write-Host "ArgoCD Pods:" -ForegroundColor White
    kubectl get pods -n argocd
    Write-Host ""
    
    Write-Host "Prometheus Pods:" -ForegroundColor White
    kubectl get pods -n monitoring | Select-Object -First 10
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[ACCESS SERVICES]" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "ArgoCD:" -ForegroundColor Yellow
    Write-Host "  kubectl port-forward svc/argocd-server -n argocd 8080:80" -ForegroundColor White
    Write-Host "  Then access: http://localhost:8080" -ForegroundColor White
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=`"{.data.password}`" | base64 -d" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Grafana:" -ForegroundColor Yellow
    Write-Host "  kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80" -ForegroundColor White
    Write-Host "  Then access: http://localhost:3000" -ForegroundColor White
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin" -ForegroundColor White
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[DEPLOYMENT COMPLETE]" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
} else {
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
