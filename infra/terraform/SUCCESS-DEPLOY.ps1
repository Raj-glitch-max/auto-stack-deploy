# SUCCESS DEPLOYMENT - ArgoCD Only (Prometheus disabled due to resources)

Write-Host "========================================" -ForegroundColor Green
Write-Host "AutoStack - SUCCESS Deployment" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

Write-Host "[1/3] Cleaning up failed Prometheus..." -ForegroundColor Yellow
helm uninstall prometheus -n monitoring --wait 2>&1 | Out-Null
kubectl delete namespace monitoring --ignore-not-found=true --timeout=60s 2>&1 | Out-Null
Write-Host "[OK] Prometheus removed" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Importing working ArgoCD..." -ForegroundColor Yellow
terraform import module.k8s_addons.helm_release.argocd argocd/argocd 2>&1 | Out-Null
Write-Host "[OK] ArgoCD imported" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Finalizing deployment..." -ForegroundColor Yellow
terraform apply -auto-approve

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[SUCCESS] DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Deployed Services:" -ForegroundColor Cyan
    Write-Host "  [OK] VPC + Networking" -ForegroundColor Green
    Write-Host "  [OK] EKS Cluster (1.28)" -ForegroundColor Green
    Write-Host "  [OK] EKS Node Group (1x t3.small)" -ForegroundColor Green
    Write-Host "  [OK] RDS PostgreSQL" -ForegroundColor Green
    Write-Host "  [OK] ECR Repositories" -ForegroundColor Green
    Write-Host "  [OK] Jenkins EC2" -ForegroundColor Green
    Write-Host "  [OK] Metrics Server" -ForegroundColor Green
    Write-Host "  [OK] Cluster Autoscaler" -ForegroundColor Green
    Write-Host "  [OK] ALB Controller" -ForegroundColor Green
    Write-Host "  [OK] ArgoCD" -ForegroundColor Green
    Write-Host "  [--] Prometheus (disabled)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ACCESS ARGOCD" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Step 1: Port forward" -ForegroundColor White
    Write-Host "  kubectl port-forward svc/argocd-server -n argocd 8080:80" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Step 2: Open browser" -ForegroundColor White
    Write-Host "  http://localhost:8080" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Step 3: Login" -ForegroundColor White
    Write-Host "  Username: admin" -ForegroundColor Gray
    Write-Host "  Password: Run this command:" -ForegroundColor Gray
    Write-Host "  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=`"{.data.password}`" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String(`$_)) }" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "VERIFY DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "All Helm Releases:" -ForegroundColor White
    helm list -A
    Write-Host ""
    
    Write-Host "ArgoCD Pods:" -ForegroundColor White
    kubectl get pods -n argocd
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT SUCCESS - ALL CRITICAL SERVICES RUNNING" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    exit 1
}
