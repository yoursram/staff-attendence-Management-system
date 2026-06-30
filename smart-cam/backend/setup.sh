#!/bin/bash

# Setup script for Smart Cam Face Recognition API
# Supports both x86_64 and ARM64 (Jetson Nano) architectures

echo "Smart Cam Setup Script"
echo "======================"

# Detect architecture
ARCH=$(uname -m)
echo "Detected architecture: $ARCH"

# Detect if running on Jetson Nano
IS_JETSON=false
if [ -f "/etc/nv_tegra_release" ]; then
    IS_JETSON=true
    echo "Jetson Nano detected!"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

echo "Installing dependencies..."

if [ "$IS_JETSON" = true ]; then
    echo "Installing Jetson Nano specific packages..."
    
    # Install system dependencies
    sudo apt-get update
    sudo apt-get install -y python3-opencv python3-numpy
    
    # Install PyTorch for Jetson Nano
    pip3 install torch torchvision --extra-index-url https://developer.download.nvidia.com/compute/redist/jp/v50
    
    # Install other requirements
    pip install fastapi uvicorn python-multipart Pillow python-dotenv aiofiles
    
    # Try to install InsightFace (may need compilation)
    pip install insightface || echo "Warning: InsightFace installation failed. You may need to compile from source."
    
else
    echo "Installing for x86_64 architecture..."
    
    # Try to fix the GLIBCXX issue by updating conda packages
    if command -v conda &> /dev/null; then
        echo "Updating conda environment..."
        conda update -n base -c defaults conda
        conda install -c conda-forge libstdcxx-ng
    fi
    
    # Install requirements
    pip install -r requirements.txt
fi

# Create necessary directories
mkdir -p uploads data/face_embeddings

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
fi

echo "Setup complete!"
echo ""
echo "To start the server:"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "Or run: ./start.sh"
