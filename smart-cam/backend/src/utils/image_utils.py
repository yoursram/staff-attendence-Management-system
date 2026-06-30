import os
import cv2
import numpy as np
from fastapi import UploadFile, HTTPException
from typing import Optional
import tempfile
import shutil

def validate_image(file: UploadFile) -> bool:
    """
    Validate if the uploaded file is a valid image
    
    Args:
        file: FastAPI UploadFile object
        
    Returns:
        bool: True if valid image, False otherwise
    """
    # Check file extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    file_extension = os.path.splitext(file.filename.lower())[1] if file.filename else ""
    
    if file_extension not in allowed_extensions:
        return False
    
    # Check content type
    allowed_content_types = {
        'image/jpeg', 'image/jpg', 'image/png', 
        'image/bmp', 'image/tiff', 'image/webp'
    }
    
    if file.content_type not in allowed_content_types:
        return False
    
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB in bytes
    if hasattr(file, 'size') and file.size > max_size:
        return False
    
    return True

async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Save uploaded file to a temporary location and return the path
    
    Args:
        upload_file: FastAPI UploadFile object
        
    Returns:
        str: Path to the saved temporary file
        
    Raises:
        HTTPException: If file validation fails or save operation fails
    """
    # Validate the image
    if not validate_image(upload_file):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. Supported formats: JPG, JPEG, PNG, BMP, TIFF, WEBP"
        )
    
    try:
        # Create a temporary file
        suffix = os.path.splitext(upload_file.filename)[1] if upload_file.filename else '.jpg'
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        # Read file content asynchronously
        content = await upload_file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Reset file pointer for potential reuse
        await upload_file.seek(0)
        
        # Verify the saved file can be read by OpenCV
        img = cv2.imread(temp_file.name)
        if img is None:
            os.unlink(temp_file.name)  # Clean up
            raise HTTPException(
                status_code=400,
                detail="Could not read the uploaded image file"
            )
        
        return temp_file.name
        
    except Exception as e:
        if 'temp_file' in locals() and hasattr(temp_file, 'name'):
            try:
                os.unlink(temp_file.name)
            except Exception:
                pass
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

def cleanup_temp_file(file_path: str) -> None:
    """
    Clean up temporary file
    
    Args:
        file_path: Path to the temporary file to delete
    """
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
    except OSError:
        # Silently ignore cleanup errors
        pass