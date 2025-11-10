#!/bin/bash

# AutoStack Production Deployment Script
# This script automates the deployment process on EC2

set -e  # Exit on error

echo "🚀 AutoStack Production Deployment"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create it from .env.example"
    exit 1
fi
print_success ".env file found"

# Get EC2 public IP
echo ""
echo "📍 Detecting EC2 instance IP..."
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
if [ "$EC2_IP" != "localhost" ]; then
    print_success "EC2 Public IP: $EC2_IP"
    print_warning "Make sure to update OAuth callback URLs to use: http://$EC2_IP:8000"
else
    print_warning "Not running on EC2 or metadata service unavailable. Using localhost."
fi

# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
print_success "BuildKit enabled for optimized builds"

# Stop and remove existing containers
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true
print_success "Cleanup complete"

# Build and start services
echo ""
echo "🔨 Building Docker images (this may take 2-3 minutes)..."
echo "   - Frontend: ~60-90 seconds"
echo "   - Backend: ~30-45 seconds"
echo "   - Database: ~10 seconds"
echo ""

START_TIME=$(date +%s)

if docker-compose up --build -d; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    print_success "Build completed in ${DURATION} seconds"
else
    print_error "Build failed. Check logs with: docker-compose logs"
    exit 1
fi

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to become healthy..."
sleep 10

# Check service health
echo ""
echo "🏥 Health Check Status:"
echo "----------------------"

check_service_health() {
    SERVICE=$1
    if docker-compose ps | grep -q "$SERVICE.*healthy"; then
        print_success "$SERVICE is healthy"
        return 0
    elif docker-compose ps | grep -q "$SERVICE.*Up"; then
        print_warning "$SERVICE is running (health check pending)"
        return 0
    else
        print_error "$SERVICE is not running"
        return 1
    fi
}

SERVICES=("autostack-db" "autostack-backend" "autostack-frontend" "autostack-prometheus" "autostack-grafana")
ALL_HEALTHY=true

for SERVICE in "${SERVICES[@]}"; do
    if ! check_service_health "$SERVICE"; then
        ALL_HEALTHY=false
    fi
done

# Display service URLs
echo ""
echo "🌐 Service URLs:"
echo "---------------"
if [ "$EC2_IP" != "localhost" ]; then
    echo "Frontend:   http://$EC2_IP:3000"
    echo "Backend:    http://$EC2_IP:8000/docs"
    echo "Grafana:    http://$EC2_IP:3001 (admin/admin)"
    echo "Prometheus: http://$EC2_IP:9090"
else
    echo "Frontend:   http://localhost:3000"
    echo "Backend:    http://localhost:8000/docs"
    echo "Grafana:    http://localhost:3001 (admin/admin)"
    echo "Prometheus: http://localhost:9090"
fi

# Display container status
echo ""
echo "📊 Container Status:"
echo "-------------------"
docker-compose ps

# Show logs option
echo ""
echo "📝 Useful Commands:"
echo "------------------"
echo "View all logs:        docker-compose logs -f"
echo "View specific logs:   docker-compose logs -f <service>"
echo "Restart service:      docker-compose restart <service>"
echo "Stop all:             docker-compose down"
echo "Rebuild specific:     docker-compose up --build -d <service>"

if [ "$ALL_HEALTHY" = true ]; then
    echo ""
    print_success "🎉 Deployment successful! All services are running."
    echo ""
    echo "Next steps:"
    echo "1. Visit the frontend URL to verify the application works"
    echo "2. Test OAuth login functionality"
    echo "3. Check monitoring dashboards in Grafana"
    echo "4. Review logs for any warnings: docker-compose logs"
else
    echo ""
    print_warning "⚠️  Some services may not be fully healthy yet."
    echo "Wait a few more seconds and check: docker-compose ps"
    echo "View logs for troubleshooting: docker-compose logs -f"
fi

echo ""
echo "For detailed documentation, see: OPTIMIZED_BUILD_GUIDE.md"
