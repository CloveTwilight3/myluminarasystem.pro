from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..schemas.auth import UserResponse
from ..auth.jwt import verify_token

router = APIRouter()
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    username = verify_token(token)
    
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        provider=current_user.provider,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at.isoformat()
    )

@router.get("/profile/{username}", response_model=UserResponse)
async def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        provider=user.provider,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat()
    )

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    email: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if email:
        # Check if email is already taken
        existing_user = db.query(User).filter(
            User.email == email, 
            User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        
        current_user.email = email
        # If user changes email, require re-verification for email provider
        if current_user.provider == "email":
            current_user.is_verified = False
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        provider=current_user.provider,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at.isoformat()
    )

@router.delete("/me")
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Delete user and all related data (cascade should handle this)
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}
