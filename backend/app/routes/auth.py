from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models.user import User, EmailVerification
from ..schemas.auth import UserSignup, UserLogin, Token, EmailVerificationRequest
from ..auth.jwt import create_access_token, get_password_hash, verify_password
from ..auth.oauth import github_oauth, discord_oauth
from ..auth.email import email_service
import secrets
import re

router = APIRouter()

def validate_username(username: str) -> bool:
    # Username must be 3-20 chars, alphanumeric + underscore/dash
    pattern = r'^[a-zA-Z0-9_-]{3,20}$'
    return bool(re.match(pattern, username))

def validate_password(password: str) -> bool:
    # At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True

@router.post("/signup", response_model=dict)
async def email_signup(user_data: UserSignup, db: Session = Depends(get_db)):
    # Validate username
    if not validate_username(user_data.username):
        raise HTTPException(
            status_code=400, 
            detail="Username must be 3-20 characters long and contain only letters, numbers, underscores, or dashes"
        )
    
    # Validate password
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters with uppercase, lowercase, and number"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        provider="email",
        hashed_password=hashed_password,
        is_verified=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create verification token
    verification_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    email_verification = EmailVerification(
        user_id=user.id,
        token=verification_token,
        expires_at=expires_at
    )
    
    db.add(email_verification)
    db.commit()
    
    # Send verification email
    email_sent = email_service.send_verification_email(
        user_data.email, 
        verification_token, 
        user_data.username
    )
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return {
        "message": "Account created successfully! Please check your email to verify your account.",
        "email": user_data.email
    }

@router.post("/login", response_model=Token)
async def email_login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email address before logging in"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    verification = db.query(EmailVerification).filter(
        EmailVerification.token == token,
        EmailVerification.is_used == False,
        EmailVerification.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    # Mark verification as used
    verification.is_used = True
    
    # Mark user as verified
    user = db.query(User).filter(User.id == verification.user_id).first()
    user.is_verified = True
    
    db.commit()
    
    return RedirectResponse(f"{settings.BASE_URL}/login?verified=true")

@router.post("/resend-verification")
async def resend_verification(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Create new verification token
    verification_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    email_verification = EmailVerification(
        user_id=user.id,
        token=verification_token,
        expires_at=expires_at
    )
    
    db.add(email_verification)
    db.commit()
    
    # Send verification email
    email_sent = email_service.send_verification_email(
        request.email, 
        verification_token, 
        user.username
    )
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return {"message": "Verification email sent successfully"}

# OAuth routes (GitHub and Discord - keeping previous code)
@router.get("/github")
async def github_login():
    state = secrets.token_urlsafe(32)
    auth_url = github_oauth.get_authorize_url(state)
    return {"auth_url": auth_url}

@router.get("/github/callback")
async def github_callback(code: str, state: str = None, db: Session = Depends(get_db)):
    try:
        token_data = await github_oauth.get_access_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        user_info = await github_oauth.get_user_info(access_token)
        
        user = db.query(User).filter(
            (User.email == user_info["email"]) | 
            (User.provider_id == user_info["id"], User.provider == "github")
        ).first()
        
        if not user:
            user = User(
                email=user_info["email"],
                username=user_info["username"],
                provider="github",
                provider_id=user_info["id"],
                is_verified=True  # OAuth users are auto-verified
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        jwt_token = create_access_token(data={"sub": user.username})
        return RedirectResponse(f"{settings.BASE_URL}/dashboard?token={jwt_token}")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/discord")
async def discord_login():
    state = secrets.token_urlsafe(32)
    auth_url = discord_oauth.get_authorize_url(state)
    return {"auth_url": auth_url}

@router.get("/discord/callback")
async def discord_callback(code: str, state: str = None, db: Session = Depends(get_db)):
    try:
        token_data = await discord_oauth.get_access_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        user_info = await discord_oauth.get_user_info(access_token)
        
        user = db.query(User).filter(
            (User.email == user_info["email"]) | 
            (User.provider_id == user_info["id"], User.provider == "discord")
        ).first()
        
        if not user:
            user = User(
                email=user_info["email"],
                username=user_info["username"],
                provider="discord",
                provider_id=user_info["id"],
                is_verified=True  # OAuth users are auto-verified
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        jwt_token = create_access_token(data={"sub": user.username})
        return RedirectResponse(f"{settings.BASE_URL}/dashboard?token={jwt_token}")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
