# Final Deployment - Deploy ArgoCD and Prometheus

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoStack - Final Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

Write-Host "[STATUS] Current state:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Helm Releases:" -ForegroundColor White
helm list -A
Write-Host ""

Write-Host "ALB Controller Status:" -ForegroundColor White
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[DEPLOY] Starting Terraform apply..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will deploy:" -ForegroundColor White
Write-Host "  1. Wait for ALB webhook (2-5 min)" -ForegroundColor Gray
Write-Host "  2. ArgoCD with LoadBalancer (3-5 min)" -ForegroundColor Gray
Write-Host "  3. Prometheus + Grafana (7-10 min)" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected time: 12-20 minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C within 5 seconds to cancel..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
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
    
    Write-Host "[VERIFY] Final status:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "All Helm Releases:" -ForegroundColor White
    helm list -A
    Write-Host ""
    
    Write-Host "ALB Controller:" -ForegroundColor White
    kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
    Write-Host ""
    
    Write-Host "ArgoCD Pods:" -ForegroundColor White
    kubectl get pods -n argocd
    Write-Host ""
    
    Write-Host "ArgoCD Service:" -ForegroundColor White
    kubectl get svc -n argocd argocd-server
    Write-Host ""
    
    Write-Host "Prometheus Pods (first 10):" -ForegroundColor White
    kubectl get pods -n monitoring | Select-Object -First 11
    Write-Host ""
    
    Write-Host "Grafana Service:" -ForegroundColor White
    kubectl get svc -n monitoring prometheus-grafana
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[NEXT STEPS]" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "1. Access ArgoCD:" -ForegroundColor Yellow
    Write-Host "   URL: kubectl get svc -n argocd argocd-server -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'" -ForegroundColor White
    Write-Host "   Username: admin" -ForegroundColor White
    Write-Host "   Password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=`"{.data.password}`" | base64 -d" -ForegroundColor White
    Write-Host ""
    
    Write-Host "2. Access Grafana:" -ForegroundColor Yellow
    Write-Host "   URL: kubectl get svc -n monitoring prometheus-grafana -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'" -ForegroundColor White
    Write-Host "   Username: admin" -ForegroundColor White
    Write-Host "   Password: prom-operator" -ForegroundColor White
    Write-Host ""
    
    Write-Host "3. Deploy Applications:" -ForegroundColor Yellow
    Write-Host "   cd ../../infra/argocd" -ForegroundColor White
    Write-Host "   kubectl apply -f apps/" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[TROUBLESHOOT]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check ALB controller logs:" -ForegroundColor White
    Write-Host "  kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check webhook wait:" -ForegroundColor White
    Write-Host "  kubectl get endpoints -n kube-system aws-load-balancer-webhook-service" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check events:" -ForegroundColor White
    Write-Host "  kubectl get events -A --sort-by='.lastTimestamp' | Select-Object -Last 20" -ForegroundColor Gray
    Write-Host ""
    
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[DEPLOYMENT COMPLETE]" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
