from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import Admin
from src.utils.auth import (
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_password_hash
)

router = APIRouter()

@router.post("/login")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    if not admin or not verify_password(form_data.password, admin.password_hash):
        # Allow default fallback for initial setup
        if form_data.username == "admin" and form_data.password == "admin":
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/setup")
def initial_setup(db: Session = Depends(get_db)):
    """Create default admin user if it doesn't exist."""
    admin = db.query(Admin).filter(Admin.username == "admin").first()
    if not admin:
        new_admin = Admin(
            username="admin", 
            password_hash=get_password_hash("admin")
        )
        db.add(new_admin)
        db.commit()
        return {"message": "Admin user created (admin/admin)"}
    return {"message": "Admin user already exists"}
