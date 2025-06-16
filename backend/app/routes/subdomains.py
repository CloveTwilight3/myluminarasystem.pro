from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import re
import secrets

from ..database import get_db
from ..models.user import User, Subdomain, AdminToken
from ..routes.users import get_current_user
from ..schemas.subdomains import (
    SubdomainCreate, 
    SubdomainResponse, 
    AdminTokenResponse,
    SubdomainUpdate
)

router = APIRouter()

def validate_subdomain(subdomain: str) -> bool:
    # Subdomain must be 3-30 chars, alphanumeric + dash, can't start/end with dash
    pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9-]{1,28}[a-zA-Z0-9])?$'
    
    # Reserved subdomains
    reserved = [
        'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
        'support', 'help', 'about', 'contact', 'news', 'dev', 'test', 'staging'
    ]
    
    return bool(re.match(pattern, subdomain)) and subdomain.lower() not in reserved

@router.post("/", response_model=SubdomainResponse)
async def create_subdomain(
    subdomain_data: SubdomainCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate subdomain format
    if not validate_subdomain(subdomain_data.subdomain):
        raise HTTPException(
            status_code=400,
            detail="Invalid subdomain format. Must be 3-30 characters, alphanumeric with dashes, cannot start/end with dash, and cannot be a reserved word."
        )
    
    # Check if user already has a subdomain
    existing_subdomain = db.query(Subdomain).filter(
        Subdomain.user_id == current_user.id
    ).first()
    
    if existing_subdomain:
        raise HTTPException(
            status_code=400,
            detail="You already have a subdomain. Each user can only have one subdomain."
        )
    
    # Check if subdomain is available
    existing = db.query(Subdomain).filter(
        Subdomain.subdomain == subdomain_data.subdomain.lower()
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Subdomain already taken"
        )
    
    # Create subdomain
    subdomain = Subdomain(
        user_id=current_user.id,
        subdomain=subdomain_data.subdomain.lower()
    )
    
    db.add(subdomain)
    db.commit()
    db.refresh(subdomain)
    
    return SubdomainResponse(
        id=subdomain.id,
        subdomain=subdomain.subdomain,
        full_url=f"https://{subdomain.subdomain}.myluminarasystem.pro",
        created_at=subdomain.created_at.isoformat(),
        owner_username=current_user.username
    )

@router.get("/my", response_model=SubdomainResponse)
async def get_my_subdomain(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subdomain = db.query(Subdomain).filter(
        Subdomain.user_id == current_user.id
    ).first()
    
    if not subdomain:
        raise HTTPException(
            status_code=404,
            detail="You don't have a subdomain yet"
        )
    
    return SubdomainResponse(
        id=subdomain.id,
        subdomain=subdomain.subdomain,
        full_url=f"https://{subdomain.subdomain}.myluminarasystem.pro",
        created_at=subdomain.created_at.isoformat(),
        owner_username=current_user.username
    )

@router.get("/check/{subdomain}")
async def check_subdomain_availability(subdomain: str, db: Session = Depends(get_db)):
    if not validate_subdomain(subdomain):
        return {
            "available": False,
            "reason": "Invalid format"
        }
    
    existing = db.query(Subdomain).filter(
        Subdomain.subdomain == subdomain.lower()
    ).first()
    
    return {
        "available": existing is None,
        "reason": "Already taken" if existing else None
    }

@router.put("/my", response_model=SubdomainResponse)
async def update_my_subdomain(
    subdomain_data: SubdomainUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subdomain = db.query(Subdomain).filter(
        Subdomain.user_id == current_user.id
    ).first()
    
    if not subdomain:
        raise HTTPException(
            status_code=404,
            detail="You don't have a subdomain yet"
        )
    
    # If changing subdomain name
    if subdomain_data.subdomain and subdomain_data.subdomain != subdomain.subdomain:
        if not validate_subdomain(subdomain_data.subdomain):
            raise HTTPException(
                status_code=400,
                detail="Invalid subdomain format"
            )
        
        # Check availability
        existing = db.query(Subdomain).filter(
            Subdomain.subdomain == subdomain_data.subdomain.lower()
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Subdomain already taken"
            )
        
        subdomain.subdomain = subdomain_data.subdomain.lower()
    
    db.commit()
    db.refresh(subdomain)
    
    return SubdomainResponse(
        id=subdomain.id,
        subdomain=subdomain.subdomain,
        full_url=f"https://{subdomain.subdomain}.myluminarasystem.pro",
        created_at=subdomain.created_at.isoformat(),
        owner_username=current_user.username
    )

@router.delete("/my")
async def delete_my_subdomain(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subdomain = db.query(Subdomain).filter(
        Subdomain.user_id == current_user.id
    ).first()
    
    if not subdomain:
        raise HTTPException(
            status_code=404,
            detail="You don't have a subdomain to delete"
        )
    
    db.delete(subdomain)
    db.commit()
    
    return {"message": "Subdomain deleted successfully"}

# Admin token management
@router.post("/my/admin-token", response_model=AdminTokenResponse)
async def create_admin_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user has a subdomain
    subdomain = db.query(Subdomain).filter(
        Subdomain.user_id == current_user.id
    ).first()
    
    if not subdomain:
        raise HTTPException(
            status_code=400,
            detail="You need a subdomain before creating an admin token"
        )
    
    # Generate secure token
    admin_token = secrets.token_urlsafe(32)
    
    # Store hashed version
    from ..auth.jwt import get_password_hash
    token_hash = get_password_hash(admin_token)
    
    # Delete existing admin token
    existing_token = db.query(AdminToken).filter(
        AdminToken.user_id == current_user.id
    ).first()
    
    if existing_token:
        db.delete(existing_token)
    
    # Create new admin token
    new_admin_token = AdminToken(
        user_id=current_user.id,
        token_hash=token_hash
    )
    
    db.add(new_admin_token)
    db.commit()
    db.refresh(new_admin_token)
    
    return AdminTokenResponse(
