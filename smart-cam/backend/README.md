# Smart Cam - Face Recognition Backend

A production-ready Python backend service for face detection and recognition using InsightFace and PyTorch. This service is designed for multi-client support including Jetson Nano, Raspberry Pi, and web applications.

## 🚀 Features

- **🎯 Face Detection**: Accurate face detection in uploaded images
- **🔍 Face Recognition**: High-performance face recognition with confidence scores  
- **📝 Face Registration**: Easy registration of new faces with names
- **🌐 Multi-Client Support**: RESTful API compatible with various devices and applications
- **⚡ High Performance**: Powered by InsightFace with PyTorch for accuracy
- **🐳 Docker Ready**: Complete Docker setup with development workflow
- **🔄 Live Reload**: Development environment with automatic code reloading

## 📊 Model Performance

- **Model**: InsightFace Buffalo-S (lightweight, optimized for CPU)
- **Detection**: 640x640 input resolution
- **Recognition**: 512-dimensional face embeddings  
- **Accuracy**: High accuracy cosine similarity matching
- **Speed**: Optimized for real-time processing

## 🛠 Technology Stack

- **Backend**: FastAPI (Python 3.9+)
- **Face Recognition**: InsightFace + PyTorch
- **Image Processing**: OpenCV
- **Containerization**: Docker + Docker Compose
- **Storage**: Pickle-based face database (production: use proper DB)

## API Endpoints

### Core Endpoints

- `POST /api/v1/detect-faces` - Detect and recognize faces in an image
- `POST /api/v1/register-face` - Register a new face with a name
- `GET /api/v1/registered-faces` - Get list of all registered faces
- `DELETE /api/v1/registered-faces/{name}` - Delete a registered face
- `GET /api/v1/status` - Get service status and model information
- `GET /health` - Health check endpoint

## Installation & Setup

### Method 1: Docker Development (Recommended)

**Perfect for development with live code reloading! 🚀**

#### Prerequisites
- Docker
- Docker Compose

#### Quick Start
```bash
# Make dev script executable
chmod +x dev.sh

# First time setup (builds image and starts)
./dev.sh build

# For daily development (after first setup)
./dev.sh start
```

#### Development Workflow

**✨ Live Code Reloading Enabled!**

1. **Start the service:**
   ```bash
   ./dev.sh start
   ```

2. **Edit your code in VS Code**
   - Any changes to Python files are automatically detected
   - Server restarts automatically in ~2-3 seconds
   - No rebuild needed!

3. **Common development commands:**
   ```bash
   ./dev.sh logs     # View live logs
   ./dev.sh restart  # Manual restart if needed
   ./dev.sh test     # Run API tests inside container
   ./dev.sh shell    # Access container shell for debugging
   ./dev.sh stop     # Stop service
   ./dev.sh clean    # Clean up Docker resources
   ```

4. **When to rebuild:**
   ```bash
   ./dev.sh build    # Only when requirements.txt changes
   ```

5. **Access the API:**
   - **API Base**: http://localhost:8000
   - **Interactive Docs**: http://localhost:8000/docs
   - **Health Check**: http://localhost:8000/health

### Method 2: Local Installation (Alternative)

#### Prerequisites

- Python 3.8 or higher
- pip
- Virtual environment (recommended)

#### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-cam
   ```

2. **Create and activate virtual environment**
   ```bash
   python3 -m venv venv_clean
   source venv_clean/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file if needed
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

   Or use the provided start script:
   ```bash
   ./start.sh
   ```

## Usage

### 1. Register a Face

Register a new face in the system:

```bash
curl -X POST "http://localhost:8000/api/v1/register-face" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "name=Krishna Prasad" \
     -F "file=/home/kp/smart-cam/src/photos_full/krishna.jpeg"
```

### 2. Detect and Recognize Faces

Send an image for face detection and recognition:

```bash
curl -X POST "http://localhost:8000/api/v1/detect-faces" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path/to/group_photo.jpg"
```

### 3. Get Registered Faces

List all registered faces:

```bash
curl -X GET "http://localhost:8000/api/v1/registered-faces"
```

### 4. Check Service Status

Get service status:

```bash
curl -X GET "http://localhost:8000/api/v1/status"
```

## Testing

### Using the Test Script

```bash
# If using Docker
./dev.sh test

# If using local installation
python test_api.py
```

### Manual Testing with cURL

```bash
# Health check
curl http://localhost:8000/health

# Status check
curl http://localhost:8000/api/v1/status

# Register a face (replace with your image path)
curl -X POST "http://localhost:8000/api/v1/register-face" \
     -F "name=Test Person" \
     -F "file=@your_image.jpg"
```

## Configuration

The application can be configured using environment variables in the `.env` file:

```env
# Server settings
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Face recognition settings
CONFIDENCE_THRESHOLD=0.6
MODEL_NAME=buffalo_l

# File paths
FACE_DB_PATH=data/face_embeddings
UPLOAD_DIR=uploads

# Upload limits
MAX_FILE_SIZE=10485760  # 10MB
```

## Docker Development Benefits

- ✅ **No library conflicts** (isolated environment)
- ✅ **Live code reloading** (instant changes)
- ✅ **Consistent environment** (same as production)
- ✅ **Easy cleanup** (`./dev.sh clean`)
- ✅ **Perfect for Jetson Nano testing**
- ✅ **No Python environment issues**

## Project Structure

```
smart-cam/
├── app.py                          # Main FastAPI application
├── config.py                       # Configuration settings
├── requirements.txt                # Python dependencies
├── dev.sh                         # Development helper script
├── start.sh                       # Local start script
├── test_api.py                    # API testing script
├── Dockerfile                     # Docker configuration
├── docker-compose.yml            # Docker Compose configuration
├── .env.example                   # Environment variables example
├── .gitignore                     # Git ignore rules
├── data/
│   └── face_embeddings/           # Stored face embeddings
├── uploads/                       # Temporary upload directory
└── src/
    ├── models/
    │   └── response_models.py     # Data models
    ├── routes/
    │   └── api.py                 # API route handlers
    ├── services/
    │   └── face_recognition_service.py  # Face recognition logic
    └── utils/
        └── image_utils.py         # Image processing utilities
```

## Client Integration Examples

### Python Client

```python
import requests

# Register a face
with open('person.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/v1/register-face',
        files={'file': f},
        data={'name': 'John Doe'}
    )

# Detect faces
with open('group_photo.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/v1/detect-faces',
        files={'file': f}
    )
    result = response.json()
    print(f"Found {result['faces_detected']} faces")
```

### JavaScript/Node.js Client

```javascript
const FormData = require('form-data');
const fs = require('fs');

// Register a face
const form = new FormData();
form.append('name', 'John Doe');
form.append('file', fs.createReadStream('person.jpg'));

fetch('http://localhost:8000/api/v1/register-face', {
    method: 'POST',
    body: form
}).then(response => response.json())
  .then(data => console.log(data));
```

### cURL Examples

```bash
# Register face
curl -X POST "http://localhost:8000/api/v1/register-face" \
     -F "name=John Doe" \
     -F "file=@person.jpg"

# Detect faces
curl -X POST "http://localhost:8000/api/v1/detect-faces" \
     -F "file=@group_photo.jpg"
```

## Performance Considerations

- **GPU Support**: The service will automatically use GPU if available for faster processing
- **Model Loading**: InsightFace models are loaded once at startup
- **Memory Usage**: Face embeddings are stored in memory for fast recognition
- **Concurrency**: FastAPI provides automatic concurrency handling

## Troubleshooting

### Common Issues

1. **Model Download**: On first run, InsightFace will download the model files (may take some time)
2. **GPU Issues**: If GPU is not available, the service will fall back to CPU
3. **Memory**: Ensure sufficient RAM for model loading and face embedding storage
4. **Dependencies**: Some system libraries may be required for OpenCV

### GLIBCXX Version Error (Linux x86_64)

If you encounter `GLIBCXX_3.4.32' not found` error when using local installation:

**Solution 1: Use Docker (Recommended)**
```bash
./dev.sh build
```

**Solution 2: Create fresh environment without conda**
```bash
# Deactivate conda
conda deactivate
# Create pure Python venv
python3 -m venv venv_pure
source venv_pure/bin/activate
pip install -r requirements.txt
```

### Docker Build Issues

If Docker build fails:

```bash
# Clean up and rebuild
./dev.sh clean
./dev.sh build

# Or manually
docker system prune -f
docker-compose up --build --force-recreate
```

### Jetson Nano Deployment

For NVIDIA Jetson Nano, the same Docker approach works:

```bash
# On Jetson Nano
git clone <your-repo>
cd smart-cam
./dev.sh build
```

The Docker image will automatically use ARM64 compatible packages.

### Logs and Debugging

```bash
# View logs
./dev.sh logs

# Access container for debugging
./dev.sh shell

# Check service status
curl http://localhost:8000/api/v1/status
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes using Docker development workflow
4. Test with `./dev.sh test`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Use `./dev.sh logs` to check error messages
3. Search existing issues
4. Create a new issue with detailed information 
