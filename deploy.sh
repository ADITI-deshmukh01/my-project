#!/bin/bash

# CampusPlacement Portal Deployment Script
# This script sets up and deploys the application

set -e

echo "🚀 Starting CampusPlacement Portal Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if required files exist
check_files() {
    local required_files=("package.json" "server.js" "Dockerfile" "docker-compose.yml" "nginx.conf")
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_error "Required file $file not found!"
            exit 1
        fi
    done
    
    print_success "All required files are present"
}

# Create environment file
create_env() {
    if [[ ! -f ".env" ]]; then
        print_status "Creating .env file from template..."
        cp env.example .env
        
        print_warning "Please edit .env file with your actual configuration values:"
        echo "  - OPENAI_API_KEY: Your OpenAI API key"
        echo "  - SMTP settings for email notifications"
        echo "  - JWT_SECRET: A strong secret key"
        echo "  - Database connection strings"
        
        read -p "Press Enter after updating .env file..."
    else
        print_success ".env file already exists"
    fi
}

# Create SSL certificates (self-signed for development)
create_ssl() {
    if [[ ! -d "ssl" ]]; then
        print_status "Creating SSL directory and self-signed certificates..."
        mkdir -p ssl
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=IN/ST=Maharashtra/L=Nagpur/O=CCoEW/CN=localhost"
        
        print_success "SSL certificates created (self-signed for development)"
        print_warning "For production, replace with proper SSL certificates"
    else
        print_success "SSL directory already exists"
    fi
}

# Create uploads directory
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p uploads
    mkdir -p logs
    print_success "Directories created"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop existing services
    docker-compose down --remove-orphans
    
    # Build and start
    docker-compose up -d --build
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB..."
    until docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
        sleep 2
    done
    print_success "MongoDB is ready"
    
    # Wait for application
    print_status "Waiting for application..."
    until curl -f http://localhost:5000/health > /dev/null 2>&1; do
        sleep 2
    done
    print_success "Application is ready"
}

# Show deployment status
show_status() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "  - Main App: http://localhost:5000"
    echo "  - Nginx (HTTPS): https://localhost"
    echo "  - MongoDB Express: http://localhost:8081 (admin/admin123)"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Open https://localhost in your browser"
    echo "  2. Register an admin account"
    echo "  3. Configure your environment variables in .env"
    echo "  4. Set up proper SSL certificates for production"
    echo ""
    echo "🔧 Useful Commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop services: docker-compose down"
    echo "  - Restart services: docker-compose restart"
    echo "  - Update and redeploy: ./deploy.sh"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "  CampusPlacement Portal Deployment"
    echo "=========================================="
    echo ""
    
    check_docker
    check_files
    create_env
    create_ssl
    create_directories
    deploy_services
    wait_for_services
    show_status
}

# Run main function
main "$@"
