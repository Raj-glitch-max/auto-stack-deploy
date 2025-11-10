# Build and Push Docker Images to ECR
# This script builds frontend and backend Docker images and pushes them to ECR

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build & Push Docker Images to ECR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$AWS_ACCOUNT_ID = "367749063363"
$AWS_REGION = "ap-south-1"
$BACKEND_REPO = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/autostack-backend"
$FRONTEND_REPO = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/autostack-frontend"

# Step 1: Login to ECR
Write-Host "[1/5] Logging into ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Logged into ECR successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to login to ECR" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Build Backend Image
Write-Host "[2/5] Building backend Docker image..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

docker build -t autostack-backend:latest ./autostack-backend/backend

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backend image built successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to build backend image" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Build Frontend Image
Write-Host "[3/5] Building frontend Docker image..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

docker build -t autostack-frontend:latest ./autostack-frontend

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend image built successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to build frontend image" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Tag and Push Backend
Write-Host "[4/5] Pushing backend image to ECR..." -ForegroundColor Yellow
docker tag autostack-backend:latest ${BACKEND_REPO}:latest
docker push ${BACKEND_REPO}:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backend image pushed to ECR" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to push backend image" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Tag and Push Frontend
Write-Host "[5/5] Pushing frontend image to ECR..." -ForegroundColor Yellow
docker tag autostack-frontend:latest ${FRONTEND_REPO}:latest
docker push ${FRONTEND_REPO}:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend image pushed to ECR" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to push frontend image" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "[SUCCESS] All images built and pushed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Images:" -ForegroundColor Cyan
Write-Host "  Backend:  ${BACKEND_REPO}:latest" -ForegroundColor White
Write-Host "  Frontend: ${FRONTEND_REPO}:latest" -ForegroundColor White
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to ArgoCD UI (http://localhost:8080)" -ForegroundColor White
Write-Host "2. Click SYNC on both applications" -ForegroundColor White
Write-Host "3. Wait for pods to start (may take 2-3 minutes)" -ForegroundColor White
Write-Host "4. Check pods: kubectl get pods -n default" -ForegroundColor White
Write-Host ""

Write-Host "The applications will now deploy automatically!" -ForegroundColor Green
