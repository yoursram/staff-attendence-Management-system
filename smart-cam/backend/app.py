from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from config import config

# New imports
from src.database import engine, Base
from src.routes.auth import router as auth_router
from src.routes.staff import router as staff_router
from src.routes.attendance import router as attendance_router

# Create necessary directories
os.makedirs(config.UPLOAD_DIR, exist_ok=True)
os.makedirs(config.FACE_DB_PATH, exist_ok=True)

# Initialize database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Cam Face Recognition API",
    description="Backend service for face detection and attendance",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(staff_router, prefix="/api/v1/staff", tags=["Staff"])
app.include_router(attendance_router, prefix="/api/v1/attendance", tags=["Attendance"])

@app.get("/")
async def root():
    return {"message": "Smart Cam Face Recognition API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "smart-cam-api"}

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG
    )
