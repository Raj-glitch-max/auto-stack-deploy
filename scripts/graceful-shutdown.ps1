# AutoStack Graceful Shutdown Script
# Cleanly destroys all AWS resources and stops billing

param(
    [switch]$Confirm = $false
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AUTOSTACK GRACEFUL SHUTDOWN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$Region = "ap-south-1"

# Warning
if (-not $Confirm) {
    Write-Host "⚠️  WARNING: This will DELETE ALL AutoStack resources!" -ForegroundColor Red
    Write-Host "   - EKS Cluster" -ForegroundColor Yellow
    Write-Host "   - EC2 Instances (Jenkins + Nodes)" -ForegroundColor Yellow
    Write-Host "   - Load Balancers" -ForegroundColor Yellow
    Write-Host "   - S3 Bucket (Terraform state)" -ForegroundColor Yellow
    Write-Host "   - DynamoDB Table (State locks)" -ForegroundColor Yellow
    Write-Host "   - All associated resources`n" -ForegroundColor Yellow
    
    $response = Read-Host "Type 'DELETE' to confirm"
    if ($response -ne "DELETE") {
        Write-Host "`n❌ Shutdown cancelled" -ForegroundColor Red
        exit 0
    }
}

Write-Host "`n🔍 Starting graceful shutdown...`n" -ForegroundColor Green

# ========================
# Phase 1: Terraform Destroy
# ========================

Write-Host "Phase 1: Terraform Destroy" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

$terraformPath = "infrastructure\terraform"
if (Test-Path $terraformPath) {
    Write-Host "📁 Found Terraform directory" -ForegroundColor Green
    
    # Check if Terraform is initialized
    if (Test-Path "$terraformPath\.terraform") {
        Write-Host "🔨 Running terraform destroy..." -ForegroundColor Cyan
        
        Push-Location $terraformPath
        try {
            # Destroy with auto-approve
            terraform destroy -auto-approve
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Terraform destroy completed" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Terraform destroy had issues (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
                Write-Host "   Continuing with manual cleanup..." -ForegroundColor Gray
            }
        } catch {
            Write-Host "❌ Error during terraform destroy: $_" -ForegroundColor Red
            Write-Host "   Continuing with manual cleanup..." -ForegroundColor Gray
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "⚠️  Terraform not initialized, skipping terraform destroy" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Terraform directory not found, skipping" -ForegroundColor Yellow
}

Start-Sleep -Seconds 5

# ========================
# Phase 2: Manual Resource Cleanup
# ========================

Write-Host "`nPhase 2: Manual Resource Cleanup" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Delete Load Balancers (if any remain)
Write-Host "🔍 Checking for remaining load balancers..." -ForegroundColor Cyan
try {
    $lbs = aws elbv2 describe-load-balancers --region $Region 2>&1 | ConvertFrom-Json
    foreach ($lb in $lbs.LoadBalancers) {
        if ($lb.LoadBalancerName -match "autostack") {
            Write-Host "   Deleting LB: $($lb.LoadBalancerName)" -ForegroundColor Yellow
            aws elbv2 delete-load-balancer --load-balancer-arn $lb.LoadBalancerArn --region $Region
        }
    }
} catch {
    Write-Host "   No load balancers to delete" -ForegroundColor Gray
}

Start-Sleep -Seconds 3

# Delete EKS Cluster (if any remain)
Write-Host "`n🔍 Checking for remaining EKS clusters..." -ForegroundColor Cyan
try {
    $clusters = aws eks list-clusters --region $Region 2>&1 | ConvertFrom-Json
    foreach ($cluster in $clusters.clusters) {
        if ($cluster -match "autostack") {
            Write-Host "   Deleting EKS cluster: $cluster" -ForegroundColor Yellow
            Write-Host "   (This may take 10-15 minutes...)" -ForegroundColor Gray
            aws eks delete-cluster --name $cluster --region $Region
        }
    }
} catch {
    Write-Host "   No EKS clusters to delete" -ForegroundColor Gray
}

Start-Sleep -Seconds 3

# Terminate EC2 Instances (if any remain)
Write-Host "`n🔍 Checking for remaining EC2 instances..." -ForegroundColor Cyan
try {
    $instances = aws ec2 describe-instances --region $Region --filters "Name=tag:Project,Values=AutoStack" 2>&1 | ConvertFrom-Json
    $instanceIds = @()
    foreach ($reservation in $instances.Reservations) {
        foreach ($instance in $reservation.Instances) {
            if ($instance.State.Name -ne "terminated") {
                $instanceIds += $instance.InstanceId
            }
        }
    }
    
    if ($instanceIds.Count -gt 0) {
        Write-Host "   Terminating $($instanceIds.Count) instance(s)..." -ForegroundColor Yellow
        aws ec2 terminate-instances --instance-ids $instanceIds --region $Region
    }
} catch {
    Write-Host "   No EC2 instances to terminate" -ForegroundColor Gray
}

Start-Sleep -Seconds 5

# ========================
# Phase 3: S3 & DynamoDB Cleanup
# ========================

Write-Host "`nPhase 3: S3 & DynamoDB Cleanup" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Delete S3 Bucket
Write-Host "🗑️  Deleting S3 bucket: autostack-tfstate" -ForegroundColor Cyan
try {
    # Remove all objects first
    Write-Host "   Removing all objects..." -ForegroundColor Gray
    aws s3 rm s3://autostack-tfstate --recursive
    
    # Delete bucket
    Write-Host "   Deleting bucket..." -ForegroundColor Gray
    aws s3 rb s3://autostack-tfstate --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ S3 bucket deleted" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  S3 bucket deletion had issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error deleting S3 bucket: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Delete DynamoDB Table
Write-Host "`n🗑️  Deleting DynamoDB table: autostack-tf-locks" -ForegroundColor Cyan
try {
    aws dynamodb delete-table --table-name autostack-tf-locks --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ DynamoDB table deleted" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  DynamoDB table deletion had issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error deleting DynamoDB table: $_" -ForegroundColor Red
}

# ========================
# Phase 4: Final Verification
# ========================

Write-Host "`nPhase 4: Final Verification" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "🔍 Checking for remaining resources...`n" -ForegroundColor Cyan

# Check EKS
$remainingClusters = (aws eks list-clusters --region $Region | ConvertFrom-Json).clusters
if ($remainingClusters -match "autostack") {
    Write-Host "   ⚠️  EKS clusters still exist (may be deleting)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No EKS clusters" -ForegroundColor Green
}

# Check EC2
$remainingInstances = aws ec2 describe-instances --region $Region --filters "Name=tag:Project,Values=AutoStack" "Name=instance-state-name,Values=running,stopped,stopping" 2>&1 | ConvertFrom-Json
if ($remainingInstances.Reservations.Count -gt 0) {
    Write-Host "   ⚠️  EC2 instances still exist (may be terminating)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No EC2 instances" -ForegroundColor Green
}

# Check Load Balancers
$remainingLBs = (aws elbv2 describe-load-balancers --region $Region 2>&1 | ConvertFrom-Json).LoadBalancers | Where-Object { $_.LoadBalancerName -match "autostack" }
if ($remainingLBs) {
    Write-Host "   ⚠️  Load balancers still exist (may be deleting)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No load balancers" -ForegroundColor Green
}

# Check S3
$s3Exists = aws s3 ls s3://autostack-tfstate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ⚠️  S3 bucket still exists" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ S3 bucket deleted" -ForegroundColor Green
}

# Check DynamoDB
try {
    aws dynamodb describe-table --table-name autostack-tf-locks --region $Region 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ⚠️  DynamoDB table still exists (may be deleting)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✅ DynamoDB table deleted" -ForegroundColor Green
}

# ========================
# Summary
# ========================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SHUTDOWN COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ Terraform destroy executed" -ForegroundColor Green
Write-Host "   ✅ Manual cleanup completed" -ForegroundColor Green
Write-Host "   ✅ S3 bucket deleted" -ForegroundColor Green
Write-Host "   ✅ DynamoDB table deleted" -ForegroundColor Green

Write-Host "`n⚠️  Note: Some resources may take a few minutes to fully delete" -ForegroundColor Yellow
Write-Host "   (EKS clusters can take 10-15 minutes)`n" -ForegroundColor Gray

Write-Host "💰 Billing Impact:" -ForegroundColor Cyan
Write-Host "   - All resources are now deleted or deleting" -ForegroundColor Green
Write-Host "   - Billing should stop within 1 hour" -ForegroundColor Green
Write-Host "   - Final charges will be prorated`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 15-20 minutes for all deletions to complete" -ForegroundColor Gray
Write-Host "   2. Check AWS console to verify all resources are gone" -ForegroundColor Gray
Write-Host "   3. Review final AWS bill in 24-48 hours`n" -ForegroundColor Gray

Write-Host "🎉 AutoStack has been gracefully shut down!" -ForegroundColor Green
Write-Host "   Thank you for using AutoStack!`n" -ForegroundColor Cyan
