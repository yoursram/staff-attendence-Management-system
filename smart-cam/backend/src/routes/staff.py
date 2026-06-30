from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import CleaningStaff
from src.utils.auth import get_current_admin
from src.services.face_recognition_service import face_service
from src.utils.image_utils import validate_image, save_upload_file
import os
from datetime import datetime

router = APIRouter()


@router.post("/register")
async def register_staff(
    staff_id: str = Form(...),
    name: str = Form(...),
    department: str = Form(...),
    shift: str = Form(...),
    mobile: str = Form(...),
    gender: str = Form(...),
    joining_date: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # admin: dict = Depends(get_current_admin)  # Protect route
):
    # Check if staff already exists
    if db.query(CleaningStaff).filter(CleaningStaff.staff_id == staff_id).first():
        raise HTTPException(status_code=400, detail="Staff ID already exists")

    if not validate_image(file):
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    file_path = await save_upload_file(file)
    try:
        embedding = face_service.extract_face_embedding(file_path)
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        # Serialize embedding for BLOB
        emb_bytes = face_service._serialize_embedding(embedding)
        
        new_staff = CleaningStaff(
            staff_id=staff_id,
            name=name,
            department=department,
            shift=shift,
            mobile=mobile,
            gender=gender,
            joining_date=datetime.strptime(joining_date, "%Y-%m-%d").date(),
            image_path=file_path,
            embedding=emb_bytes
        )
        db.add(new_staff)
        db.commit()
        
        # Update service in-memory db
        face_service.reload_database()
        
        return {"success": True, "message": "Staff registered successfully"}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error registering staff: {str(e)}")

@router.get("/")
def get_all_staff(db: Session = Depends(get_db)):
    staff_list = db.query(CleaningStaff).all()
    result = []
    for s in staff_list:
        result.append({
            "staff_id": s.staff_id,
            "name": s.name,
            "department": s.department,
            "shift": s.shift,
            "mobile": s.mobile,
            "gender": s.gender,
            "joining_date": s.joining_date,
            "registered_at": s.registered_at
        })
    return {"staff": result}

@router.delete("/{staff_id}")
def delete_staff(staff_id: str, db: Session = Depends(get_db)):
    staff = db.query(CleaningStaff).filter(CleaningStaff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    db.delete(staff)
    db.commit()
    face_service.reload_database()
    return {"success": True, "message": "Staff deleted successfully"}
