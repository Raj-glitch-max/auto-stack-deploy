# Quick unlock - just delete pending Helm secrets

Write-Host "Unlocking Helm releases..."

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

# Delete pending secrets in kube-system
Write-Host "Cleaning kube-system..."
kubectl delete secrets -n kube-system -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n kube-system -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null

# Delete pending secrets in argocd
Write-Host "Cleaning argocd..."
kubectl delete secrets -n argocd -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n argocd -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null

# Delete pending secrets in monitoring
Write-Host "Cleaning monitoring..."
kubectl delete secrets -n monitoring -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n monitoring -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null

Write-Host ""
Write-Host "Done! Now run: terraform apply -auto-approve"
