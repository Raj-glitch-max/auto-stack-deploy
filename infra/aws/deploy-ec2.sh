#!/bin/bash
# AutoStack AWS EC2 Deployment Script
# This script deploys AutoStack to an AWS EC2 instance using Docker Compose

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="autostack"
REPO_URL="https://github.com/Raj-glitch-max/auto-stack-deploy.git"
DEPLOY_DIR="/opt/autostack"
DOCKER_COMPOSE_VERSION="2.23.0"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

install_dependencies() {
    log_info "Installing system dependencies..."
    
    # Update package list
    apt-get update -y
    
    # Install required packages
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        git \
        jq \
        unzip
    
    log_success "System dependencies installed"
}

install_docker() {
    log_info "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        log_success "Docker is already installed: $(docker --version)"
        return
    fi
    
    log_info "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group (if not root)
    if [ -n "${SUDO_USER:-}" ]; then
        usermod -aG docker "$SUDO_USER"
        log_info "Added $SUDO_USER to docker group. You may need to log out and back in."
    fi
    
    log_success "Docker installed: $(docker --version)"
}

install_docker_compose() {
    log_info "Checking Docker Compose installation..."
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose is already installed: $(docker-compose --version)"
        return
    fi
    
    log_info "Installing Docker Compose..."
    
    # Download Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    
    # Make it executable
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose installed: $(docker-compose --version)"
}

configure_firewall() {
    log_info "Configuring firewall..."
    
    # Install UFW if not present
    if ! command -v ufw &> /dev/null; then
        apt-get install -y ufw
    fi
    
    # Configure firewall rules
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 3000/tcp  # Frontend (optional, for direct access)
    ufw allow 8000/tcp  # Backend API (optional, for direct access)
    
    log_success "Firewall configured"
}

clone_repository() {
    log_info "Cloning repository..."
    
    # Remove existing directory if present
    if [ -d "$DEPLOY_DIR" ]; then
        log_warning "Existing deployment found at $DEPLOY_DIR"
        read -p "Do you want to remove it and clone fresh? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$DEPLOY_DIR"
        else
            log_info "Skipping clone, using existing repository"
            cd "$DEPLOY_DIR"
            git pull origin main
            return
        fi
    fi
    
    # Clone repository
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    
    log_success "Repository cloned to $DEPLOY_DIR"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    cd "$DEPLOY_DIR"
    
    # Check if .env exists
    if [ -f .env ]; then
        log_warning ".env file already exists"
        read -p "Do you want to reconfigure it? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Using existing .env file"
            return
        fi
    fi
    
    # Create .env file
    cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=autostack

# Backend Configuration
SECRET_KEY=$(openssl rand -hex 32)

# GitHub OAuth (REQUIRED - Get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Google OAuth (REQUIRED - Get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://$(curl -s ifconfig.me):8000
EOF
    
    log_success ".env file created"
    log_warning "IMPORTANT: Edit .env file and add your OAuth credentials!"
    log_info "GitHub OAuth: https://github.com/settings/developers"
    log_info "Google OAuth: https://console.cloud.google.com"
    
    read -p "Press Enter after you've updated the .env file..."
}

deploy_application() {
    log_info "Deploying application..."
    
    cd "$DEPLOY_DIR"
    
    # Stop existing containers
    if docker-compose ps -q 2>/dev/null | grep -q .; then
        log_info "Stopping existing containers..."
        docker-compose down
    fi
    
    # Pull latest images
    log_info "Pulling Docker images..."
    docker-compose pull
    
    # Build and start containers
    log_info "Building and starting containers..."
    docker-compose up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:8000/health &>/dev/null; then
            log_success "Backend is healthy!"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for backend... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend failed to start. Check logs with: docker-compose logs backend"
        exit 1
    fi
    
    log_success "Application deployed successfully!"
}

show_status() {
    log_info "Checking deployment status..."
    
    cd "$DEPLOY_DIR"
    
    echo ""
    echo "=== Container Status ==="
    docker-compose ps
    
    echo ""
    echo "=== Access Points ==="
    local public_ip=$(curl -s ifconfig.me)
    echo "Frontend:    http://$public_ip:3000"
    echo "Backend API: http://$public_ip:8000"
    echo "API Docs:    http://$public_ip:8000/docs"
    echo "Prometheus:  http://$public_ip:9090"
    echo "Grafana:     http://$public_ip:3001 (admin/admin)"
    
    echo ""
    echo "=== Useful Commands ==="
    echo "View logs:        cd $DEPLOY_DIR && docker-compose logs -f"
    echo "Restart:          cd $DEPLOY_DIR && docker-compose restart"
    echo "Stop:             cd $DEPLOY_DIR && docker-compose down"
    echo "Update & Restart: cd $DEPLOY_DIR && git pull && docker-compose up -d --build"
}

setup_systemd_service() {
    log_info "Setting up systemd service..."
    
    cat > /etc/systemd/system/autostack.service << EOF
[Unit]
Description=AutoStack Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable autostack.service
    
    log_success "Systemd service created and enabled"
    log_info "Service will auto-start on system boot"
}

# Main execution
main() {
    echo "========================================="
    echo "  AutoStack AWS EC2 Deployment Script"
    echo "========================================="
    echo ""
    
    check_root
    install_dependencies
    install_docker
    install_docker_compose
    configure_firewall
    clone_repository
    setup_environment
    deploy_application
    setup_systemd_service
    show_status
    
    echo ""
    log_success "Deployment completed successfully!"
    echo ""
    log_warning "Next steps:"
    echo "1. Configure your domain DNS to point to this server's IP"
    echo "2. Set up SSL/TLS certificates (recommended: Let's Encrypt)"
    echo "3. Configure OAuth callback URLs in GitHub and Google"
    echo "4. Set up monitoring and alerts"
    echo ""
}

# Run main function
main "$@"
