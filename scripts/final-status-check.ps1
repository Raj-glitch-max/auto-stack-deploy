# AutoStack Final Status Check & Cleanup Script
# Checks all resources and prepares for graceful shutdown

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AUTOSTACK FINAL STATUS CHECK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Set region
$Region = "ap-south-1"

# ========================
# 1. AWS Account Info
# ========================

Write-Host "1. AWS Account Information..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "   Account ID: $($identity.Account)" -ForegroundColor Green
    Write-Host "   User ARN: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Cannot get AWS identity" -ForegroundColor Red
    exit 1
}

# ========================
# 2. EKS Cluster Status
# ========================

Write-Host "`n2. Checking EKS Clusters..." -ForegroundColor Yellow
try {
    $clusters = aws eks list-clusters --region $Region 2>&1 | ConvertFrom-Json
    if ($clusters.clusters.Count -gt 0) {
        Write-Host "   Found $($clusters.clusters.Count) cluster(s):" -ForegroundColor Green
        foreach ($cluster in $clusters.clusters) {
            Write-Host "   - $cluster" -ForegroundColor Cyan
            
            # Get cluster details
            $clusterInfo = aws eks describe-cluster --name $cluster --region $Region 2>&1 | ConvertFrom-Json
            Write-Host "     Status: $($clusterInfo.cluster.status)" -ForegroundColor Gray
            Write-Host "     Endpoint: $($clusterInfo.cluster.endpoint)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No EKS clusters found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR checking EKS: $_" -ForegroundColor Red
}

# ========================
# 3. EC2 Instances
# ========================

Write-Host "`n3. Checking EC2 Instances..." -ForegroundColor Yellow
try {
    $instances = aws ec2 describe-instances --region $Region --filters "Name=instance-state-name,Values=running,stopped" 2>&1 | ConvertFrom-Json
    
    $count = 0
    foreach ($reservation in $instances.Reservations) {
        foreach ($instance in $reservation.Instances) {
            $count++
            $name = ($instance.Tags | Where-Object { $_.Key -eq "Name" }).Value
            Write-Host "   - Instance: $($instance.InstanceId)" -ForegroundColor Cyan
            Write-Host "     Name: $name" -ForegroundColor Gray
            Write-Host "     State: $($instance.State.Name)" -ForegroundColor Gray
            Write-Host "     Public IP: $($instance.PublicIpAddress)" -ForegroundColor Gray
            Write-Host "     Type: $($instance.InstanceType)" -ForegroundColor Gray
        }
    }
    
    if ($count -eq 0) {
        Write-Host "   No EC2 instances found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR checking EC2: $_" -ForegroundColor Red
}

# ========================
# 4. RDS Databases
# ========================

Write-Host "`n4. Checking RDS Databases..." -ForegroundColor Yellow
try {
    $databases = aws rds describe-db-instances --region $Region 2>&1 | ConvertFrom-Json
    if ($databases.DBInstances.Count -gt 0) {
        Write-Host "   Found $($databases.DBInstances.Count) database(s):" -ForegroundColor Green
        foreach ($db in $databases.DBInstances) {
            Write-Host "   - $($db.DBInstanceIdentifier)" -ForegroundColor Cyan
            Write-Host "     Status: $($db.DBInstanceStatus)" -ForegroundColor Gray
            Write-Host "     Endpoint: $($db.Endpoint.Address)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No RDS instances found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR checking RDS: $_" -ForegroundColor Red
}

# ========================
# 5. Load Balancers
# ========================

Write-Host "`n5. Checking Load Balancers..." -ForegroundColor Yellow
try {
    $lbs = aws elbv2 describe-load-balancers --region $Region 2>&1 | ConvertFrom-Json
    if ($lbs.LoadBalancers.Count -gt 0) {
        Write-Host "   Found $($lbs.LoadBalancers.Count) load balancer(s):" -ForegroundColor Green
        foreach ($lb in $lbs.LoadBalancers) {
            Write-Host "   - $($lb.LoadBalancerName)" -ForegroundColor Cyan
            Write-Host "     DNS: $($lb.DNSName)" -ForegroundColor Gray
            Write-Host "     State: $($lb.State.Code)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No load balancers found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR checking load balancers: $_" -ForegroundColor Red
}

# ========================
# 6. S3 Buckets
# ========================

Write-Host "`n6. Checking S3 Buckets..." -ForegroundColor Yellow
try {
    $buckets = aws s3 ls 2>&1
    if ($buckets -match "autostack") {
        Write-Host "   AutoStack buckets found:" -ForegroundColor Green
        $buckets -split "`n" | Where-Object { $_ -match "autostack" } | ForEach-Object {
            Write-Host "   - $_" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   No AutoStack buckets found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR checking S3: $_" -ForegroundColor Red
}

# ========================
# 7. DynamoDB Tables
# ========================

Write-Host "`n7. Checking DynamoDB Tables..." -ForegroundColor Yellow
try {
    $tables = aws dynamodb list-tables --region $Region 2>&1 | ConvertFrom-Json
    if ($tables.TableNames -contains "autostack-tf-locks") {
        Write-Host "   Found: autostack-tf-locks" -ForegroundColor Green
    } else {
        Write-Host "   No AutoStack tables found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR checking DynamoDB: $_" -ForegroundColor Red
}

# ========================
# Summary
# ========================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STATUS CHECK COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. If Jenkins instance found, SSH to check status" -ForegroundColor Gray
Write-Host "  2. If EKS cluster found, configure kubectl" -ForegroundColor Gray
Write-Host "  3. Review resources above before cleanup" -ForegroundColor Gray
Write-Host "  4. Run cleanup script when ready`n" -ForegroundColor Gray
