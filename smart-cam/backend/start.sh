#!/bin/bash

# Start script for Smart Cam Face Recognition API

echo "Starting Smart Cam Face Recognition API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
mkdir -p uploads
mkdir -p data/face_embeddings

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
fi

# Start the server
echo "Starting server..."
python app.py
