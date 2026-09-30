from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import CleaningStaff, Attendance
from src.utils.auth import get_current_admin
from src.services.face_recognition_service import face_service
from src.utils.image_utils import validate_image, save_upload_file
import os
from datetime import datetime
from typing import Optional

router = APIRouter()

class StaffUpdatePayload(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    shift: Optional[str] = None
    mobile: Optional[str] = None
    gender: Optional[str] = None
    joining_date: Optional[str] = None


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

@router.get("")
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

@router.put("/{staff_id}")
@router.put("/{staff_id}/")
def update_staff(staff_id: str, payload: StaffUpdatePayload, db: Session = Depends(get_db)):
    staff = db.query(CleaningStaff).filter(CleaningStaff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if payload.name is not None:
        staff.name = payload.name
    if payload.department is not None:
        staff.department = payload.department
    if payload.shift is not None:
        staff.shift = payload.shift
    if payload.mobile is not None:
        staff.mobile = payload.mobile
    if payload.gender is not None:
        staff.gender = payload.gender
    if payload.joining_date is not None:
        staff.joining_date = datetime.strptime(payload.joining_date, "%Y-%m-%d").date()

    db.commit()
    db.refresh(staff)
    face_service.reload_database()

    return {
        "success": True,
        "message": "Staff updated successfully",
        "staff": {
            "staff_id": staff.staff_id,
            "name": staff.name,
            "department": staff.department,
            "shift": staff.shift,
            "mobile": staff.mobile,
            "gender": staff.gender,
            "joining_date": staff.joining_date,
            "registered_at": staff.registered_at
        }
    }

@router.delete("/{staff_id}")
@router.delete("/{staff_id}/")
def delete_staff(staff_id: str, db: Session = Depends(get_db)):
    staff = db.query(CleaningStaff).filter(CleaningStaff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    # Clean up image file on disk if it exists
    if staff.image_path and os.path.exists(staff.image_path):
        try:
            os.remove(staff.image_path)
        except Exception as e:
            print(f"Error removing image file {staff.image_path}: {e}")

    # Remove related attendance records to prevent orphan data or FK violation
    db.query(Attendance).filter(Attendance.staff_id == staff_id).delete()

    db.delete(staff)
    db.commit()
    face_service.reload_database()
    return {"success": True, "message": "Staff deleted successfully"}
