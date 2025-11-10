# Simple retry script - no fancy output
# Just cleans up and retries terraform

Write-Host "Cleaning up failed Prometheus release..."
helm uninstall prometheus -n monitoring 2>&1 | Out-Null

Write-Host "Retrying Terraform apply..."
terraform apply -auto-approve
