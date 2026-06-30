from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import shutil
from src.services.face_recognition_service import FaceRecognitionService
from src.utils.image_utils import validate_image, save_upload_file
from config import config

router = APIRouter()
face_service = FaceRecognitionService()

@router.post("/detect-faces")
async def detect_faces(file: UploadFile = File(...)):
    """
    Detect and recognize faces in an uploaded image.
    """
    try:
        # Validate the uploaded file
        if not validate_image(file):
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Save the uploaded file temporarily
        file_path = await save_upload_file(file)
        
        try:
            # Process the image
            result = face_service.detect_and_recognize_faces(file_path)
            return JSONResponse(content=result)
        
        finally:
            # Clean up the temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/register-face")
async def register_face(
    name: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Register a new face with a name for future recognition.
    """
    try:
        # Validate the uploaded file
        if not validate_image(file):
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Save the uploaded file temporarily
        file_path = await save_upload_file(file)
        
        try:
            # Register the face
            result = face_service.register_face(file_path, name)
            return JSONResponse(content=result)
        
        finally:
            # Clean up the temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registering face: {str(e)}")

@router.get("/registered-faces")
async def get_registered_faces():
    """
    Get list of all registered faces.
    """
    try:
        faces = face_service.get_registered_faces()
        return JSONResponse(content={"registered_faces": faces})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving faces: {str(e)}")

@router.delete("/registered-faces/{name}")
async def delete_registered_face(name: str):
    """
    Delete a registered face by name.
    """
    try:
        result = face_service.delete_registered_face(name)
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting face: {str(e)}")

@router.get("/status")
async def get_status():
    """
    Get service status and model information.
    """
    try:
        status = face_service.get_status()
        return JSONResponse(content=status)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")
