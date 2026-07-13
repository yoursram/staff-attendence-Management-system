from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.database import get_db
from src.models import Attendance, CleaningStaff
from src.services.face_recognition_service import face_service
from src.utils.image_utils import validate_image, save_upload_file
import os
from datetime import datetime

router = APIRouter()


@router.post("/scan")
async def scan_attendance(
    file: UploadFile = File(...),
    camera_location: str = Form("Main Gate"),
    confirm: bool = Form(False),
    confirmed_staff_ids: str | None = Form(None),
    db: Session = Depends(get_db)
):
    if not validate_image(file):
        raise HTTPException(status_code=400, detail="Invalid image file")

    file_path = await save_upload_file(file)
    try:
        result = face_service.detect_and_recognize_faces(file_path)

        if result["faces_detected"] == 0:
            return {"success": False, "message": "No face detected"}

        recognized_people = []
        seen_staff_ids = set()

        for face in result.get("faces", []):
            recognition = face.get("recognition") or {}
            staff_id = recognition.get("staff_id")
            if not staff_id or staff_id == "Unknown" or staff_id in seen_staff_ids:
                continue

            seen_staff_ids.add(staff_id)
            recognized_people.append({
                "face_id": face.get("face_id"),
                "staff_id": staff_id,
                "name": recognition.get("name", "Unknown"),
                "confidence": float(recognition.get("confidence", 0.0)),
            })

        if not recognized_people:
            return {"success": False, "message": "Unknown Person"}

        if not confirm:
            return {
                "success": True,
                "message": "Recognition complete. Please verify the detected people before marking attendance.",
                "requires_verification": True,
                "data": {
                    "recognized_people": recognized_people,
                    "camera_location": camera_location,
                    "scanned_at": datetime.now().strftime("%I:%M %p")
                }
            }

        selected_ids = []
        if confirmed_staff_ids:
            selected_ids = [staff_id.strip() for staff_id in confirmed_staff_ids.split(",") if staff_id.strip()]

        if not selected_ids:
            selected_ids = [person["staff_id"] for person in recognized_people]

        today = datetime.now().date()
        current_time = datetime.now().time()
        marked_people = []
        already_marked_people = []
        attendance_records = []

        for person in recognized_people:
            if person["staff_id"] not in selected_ids:
                continue

            existing = db.query(Attendance).filter(
                Attendance.staff_id == person["staff_id"],
                Attendance.attendance_date == today
            ).first()

            if existing:
                already_marked_people.append({
                    "staff_id": person["staff_id"],
                    "name": person["name"],
                    "status": "Already Marked"
                })
                continue

            attendance_records.append(Attendance(
                staff_id=person["staff_id"],
                attendance_date=today,
                attendance_time=current_time,
                status="Present",
                confidence_score=person["confidence"],
                camera_location=camera_location
            ))
            marked_people.append({
                "staff_id": person["staff_id"],
                "name": person["name"],
                "status": "Present",
                "time": current_time.strftime("%I:%M %p"),
                "date": today.strftime("%Y-%m-%d")
            })

        if attendance_records:
            db.add_all(attendance_records)
            db.commit()

        return {
            "success": True,
            "message": "Attendance marked successfully for the verified people.",
            "requires_verification": False,
            "data": {
                "marked_people": marked_people,
                "already_marked_people": already_marked_people,
                "total_marked": len(marked_people)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing attendance: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/daily")
def get_daily_attendance(date: str = None, db: Session = Depends(get_db)):
    if not date:
        query_date = datetime.now().date()
    else:
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
        
    records = db.query(Attendance, CleaningStaff).outerjoin(
        CleaningStaff, Attendance.staff_id == CleaningStaff.staff_id
    ).filter(Attendance.attendance_date == query_date).all()
    
    total_staff = db.query(CleaningStaff).count()
    
    # Only count present staff that still exist in the database (staff is not None)
    present_staff = sum(1 for att, staff in records if staff is not None)
    absent_staff = max(0, total_staff - present_staff)
    
    data = []
    for att, staff in records:
        data.append({
            "staff_id": att.staff_id,
            "name": staff.name if staff else "Unknown",
            "department": staff.department if staff else "-",
            "time": att.attendance_time.strftime("%I:%M %p"),
            "status": att.status,
            "confidence_score": att.confidence_score
        })
        
    return {
        "stats": {
            "total": total_staff,
            "present": present_staff,
            "absent": absent_staff,
            "percentage": (present_staff / total_staff * 100) if total_staff > 0 else 0
        },
        "records": data
    }

@router.get("/history")
def get_attendance_history(db: Session = Depends(get_db)):
    records = db.query(Attendance, CleaningStaff).outerjoin(
        CleaningStaff, Attendance.staff_id == CleaningStaff.staff_id
    ).order_by(Attendance.attendance_date.desc(), Attendance.attendance_time.desc()).all()
    
    data = []
    for att, staff in records:
        data.append({
            "id": att.id,
            "staff_id": att.staff_id,
            "name": staff.name if staff else "Unknown",
            "date": att.attendance_date.strftime("%Y-%m-%d"),
            "time": att.attendance_time.strftime("%I:%M %p"),
            "status": att.status
        })
    return {"records": data}

@router.get("/weekly")
def get_weekly_stats(db: Session = Depends(get_db)):
    from datetime import timedelta
    today = datetime.now().date()
    
    total_staff = db.query(CleaningStaff).count()
    weekly_data = []
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        records = db.query(Attendance, CleaningStaff).outerjoin(
            CleaningStaff, Attendance.staff_id == CleaningStaff.staff_id
        ).filter(Attendance.attendance_date == target_date).all()
        
        present_staff = sum(1 for att, staff in records if staff is not None)
        absent_staff = max(0, total_staff - present_staff)
        
        weekly_data.append({
            "name": target_date.strftime("%a"),
            "present": present_staff,
            "absent": absent_staff,
            "date": target_date.strftime("%Y-%m-%d")
        })
        
    return {"weekly": weekly_data}
