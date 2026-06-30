from sqlalchemy import Column, Integer, String, Float, DateTime, LargeBinary, Date, Time
from src.database import Base
from datetime import datetime

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class CleaningStaff(Base):
    __tablename__ = "cleaning_staff"
    staff_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255))
    department = Column(String(255))
    shift = Column(String(50))
    mobile = Column(String(20))
    gender = Column(String(20))
    joining_date = Column(Date)
    image_path = Column(String(255))
    embedding = Column(LargeBinary) # BLOB for numpy array
    registered_at = Column(DateTime, default=datetime.utcnow)

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String(50), index=True)
    attendance_date = Column(Date, index=True)
    attendance_time = Column(Time)
    status = Column(String(50))
    confidence_score = Column(Float)
    camera_location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
