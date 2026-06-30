#!/bin/bash

# Smart Cam Development Helper Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[SMART-CAM]${NC} $1"
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

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Main commands
case "$1" in
    "build")
        print_status "🔨 Building and starting Smart Cam..."
        check_docker
        docker-compose up --build --detach
        print_success "Smart Cam is running! 🚀"
        print_status "API: http://localhost:8000"
        print_status "Docs: http://localhost:8000/docs"
        ;;
    
    "start")
        print_status "▶️  Starting Smart Cam..."
        check_docker
        docker-compose up --detach
        print_success "Smart Cam is running! 🚀"
        ;;
    
    "stop")
        print_status "⏹️  Stopping Smart Cam..."
        docker-compose down
        print_success "Smart Cam stopped."
        ;;
    
    "restart")
        print_status "🔄 Restarting Smart Cam..."
        docker-compose restart
        print_success "Smart Cam restarted."
        ;;
    
    "logs")
        print_status "📋 Showing Smart Cam logs (Press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    
    "shell")
        print_status "🐚 Opening Smart Cam container shell..."
        docker-compose exec smart-cam-api bash
        ;;
    
    "test")
        print_status "🧪 Running API tests..."
        docker-compose exec smart-cam-api python test_api.py
        ;;
    
    "clean")
        print_warning "🧹 Cleaning up Docker resources..."
        docker-compose down -v
        docker system prune -f
        print_success "Cleanup completed."
        ;;
    
    "status")
        print_status "📊 Checking Smart Cam status..."
        if docker-compose ps | grep -q "Up"; then
            print_success "Smart Cam is running"
            curl -s http://localhost:8000/health | python -m json.tool
        else
            print_warning "Smart Cam is not running"
        fi
        ;;
    
    *)
        echo "Smart Cam Development Helper"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build     - Build and start Smart Cam (first time setup)"
        echo "  start     - Start Smart Cam services"
        echo "  stop      - Stop Smart Cam services"
        echo "  restart   - Restart Smart Cam services"
        echo "  logs      - View live logs"
        echo "  shell     - Open container shell"
        echo "  test      - Run API tests"
        echo "  clean     - Clean up Docker resources"
        echo "  status    - Check service status"
        echo ""
        echo "Examples:"
        echo "  $0 build     # First time setup"
        echo "  $0 start     # Daily development"
        echo "  $0 logs      # Monitor logs"
        ;;
esac
