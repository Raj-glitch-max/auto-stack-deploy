# ============================================
# AutoStack AWS Setup Script
# ============================================

Write-Host "🚀 Setting up AutoStack on AWS..." -ForegroundColor Cyan

# Set AWS credentials
$env:AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY"
$env:AWS_REGION = "ap-south-1"
$env:AWS_DEFAULT_REGION = "ap-south-1"

Write-Host "✅ AWS credentials configured" -ForegroundColor Green

# Verify AWS CLI is installed
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Verify Terraform is installed
try {
    $tfVersion = terraform version
    Write-Host "✅ Terraform found: $tfVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Terraform not found. Please install Terraform first." -ForegroundColor Red
    exit 1
}

# Create S3 bucket for Terraform state if it doesn't exist
Write-Host "`n📦 Checking S3 bucket for Terraform state..." -ForegroundColor Cyan
$bucketExists = aws s3 ls s3://autostack-tfstate 2>$null
if (-not $bucketExists) {
    Write-Host "Creating S3 bucket: autostack-tfstate" -ForegroundColor Yellow
    aws s3 mb s3://autostack-tfstate --region ap-south-1
    aws s3api put-bucket-versioning --bucket autostack-tfstate --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket autostack-tfstate --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}'
    Write-Host "✅ S3 bucket created and configured" -ForegroundColor Green
} else {
    Write-Host "✅ S3 bucket already exists" -ForegroundColor Green
}

# Create DynamoDB table for state locking if it doesn't exist
Write-Host "`n🔒 Checking DynamoDB table for state locking..." -ForegroundColor Cyan
$tableExists = aws dynamodb describe-table --table-name autostack-tf-locks --region ap-south-1 2>$null
if (-not $tableExists) {
    Write-Host "Creating DynamoDB table: autostack-tf-locks" -ForegroundColor Yellow
    aws dynamodb create-table `
        --table-name autostack-tf-locks `
        --attribute-definitions AttributeName=LockID,AttributeType=S `
        --key-schema AttributeName=LockID,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region ap-south-1
    Write-Host "✅ DynamoDB table created" -ForegroundColor Green
} else {
    Write-Host "✅ DynamoDB table already exists" -ForegroundColor Green
}

Write-Host "`n✅ AWS setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: terraform init" -ForegroundColor White
Write-Host "2. Run: terraform validate" -ForegroundColor White
Write-Host "3. Run: terraform plan" -ForegroundColor White
Write-Host "4. Run: terraform apply" -ForegroundColor White
