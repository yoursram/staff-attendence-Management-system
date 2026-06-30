import os
from typing import Optional

class Config:
    # Server settings
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Face recognition settings
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.6))
    MODEL_NAME = os.getenv("MODEL_NAME", "buffalo_s")
    
    # File paths
    FACE_DB_PATH = os.getenv("FACE_DB_PATH", "data/face_embeddings")
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
    
    # File upload settings
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}

config = Config()
