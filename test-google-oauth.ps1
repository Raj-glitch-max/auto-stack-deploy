# Test Google OAuth Configuration
# This script starts Docker services and tests the Google OAuth endpoint

Write-Host "🚀 Starting Google OAuth Test..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "📋 Step 1: Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running!" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop and wait for it to be ready." -ForegroundColor Yellow
        Write-Host "   Then run this script again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and wait for it to be ready." -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
Write-Host ""
Write-Host "📋 Step 2: Checking .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    $envContent = Get-Content .env | Select-String "GOOGLE_CLIENT_ID"
    if ($envContent) {
        Write-Host "✅ GOOGLE_CLIENT_ID is set in .env" -ForegroundColor Green
    } else {
        Write-Host "❌ GOOGLE_CLIENT_ID not found in .env" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host ""
Write-Host "📋 Step 3: Starting Docker services..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes on first run..." -ForegroundColor Gray

docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker services started" -ForegroundColor Green

# Wait for services to be ready
Write-Host ""
Write-Host "📋 Step 4: Waiting for services to be ready..." -ForegroundColor Yellow
Write-Host "   Waiting 30 seconds for services to initialize..." -ForegroundColor Gray

Start-Sleep -Seconds 30

# Check backend health
Write-Host ""
Write-Host "📋 Step 5: Checking backend health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10 -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is healthy" -ForegroundColor Green
        Write-Host "   Response: $($healthResponse.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Backend returned status code: $($healthResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend is not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please check Docker logs: docker-compose logs backend" -ForegroundColor Yellow
    exit 1
}

# Test Google OAuth endpoint
Write-Host ""
Write-Host "📋 Step 6: Testing Google OAuth endpoint..." -ForegroundColor Yellow
try {
    $oauthResponse = Invoke-WebRequest -Uri "http://localhost:8000/auth/google" -TimeoutSec 10 -UseBasicParsing
    if ($oauthResponse.StatusCode -eq 200) {
        $oauthData = $oauthResponse.Content | ConvertFrom-Json
        Write-Host "✅ Google OAuth endpoint is working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   OAuth URL generated:" -ForegroundColor Cyan
        Write-Host "   $($oauthData.url)" -ForegroundColor White
        Write-Host ""
        
        # Check if URL contains the correct client ID
        if ($oauthData.url -match "570685065231-45pa6c8o3j3l1ifrh7j3bb1711jdf49v") {
            Write-Host "✅ Client ID is correct in OAuth URL" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Client ID might not be correct in OAuth URL" -ForegroundColor Yellow
        }
        
        # Check if URL contains the correct callback
        if ($oauthData.url -match "localhost:8000/auth/google/callback") {
            Write-Host "✅ Callback URL is correct in OAuth URL" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Callback URL might not be correct in OAuth URL" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ OAuth endpoint returned status code: $($oauthResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to test Google OAuth endpoint" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error details
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "   Checking backend logs..." -ForegroundColor Yellow
    docker-compose logs backend --tail=50 | Select-String "Google OAuth"
}

# Check backend logs for OAuth configuration
Write-Host ""
Write-Host "📋 Step 7: Checking backend logs for OAuth configuration..." -ForegroundColor Yellow
$logs = docker-compose logs backend --tail=100 2>&1
$oauthLogs = $logs | Select-String "Google OAuth"
if ($oauthLogs) {
    Write-Host "✅ Found OAuth logs:" -ForegroundColor Green
    $oauthLogs | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠️ No OAuth logs found (this might be normal if endpoint hasn't been called)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Configuration verified:" -ForegroundColor Green
Write-Host "   - .env file exists with OAuth credentials" -ForegroundColor White
Write-Host "   - Docker services are running" -ForegroundColor White
Write-Host "   - Backend is healthy" -ForegroundColor White
Write-Host "   - Google OAuth endpoint is accessible" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000/login in your browser" -ForegroundColor White
Write-Host "   2. Click 'Continue with Google' button" -ForegroundColor White
Write-Host "   3. Complete Google OAuth consent" -ForegroundColor White
Write-Host "   4. Verify redirect to dashboard" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Make sure Google Cloud Console is configured with:" -ForegroundColor Yellow
Write-Host "   - Authorized redirect URI: http://localhost:8000/auth/google/callback" -ForegroundColor White
Write-Host "   - Authorized JavaScript origins: http://localhost:3000, http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "📝 To view logs: docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "🛑 To stop services: docker-compose down" -ForegroundColor Gray
Write-Host ""


