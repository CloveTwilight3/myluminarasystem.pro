from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    provider = Column(String, nullable=False)  # 'email', 'github', 'discord'
    provider_id = Column(String, nullable=True)  # OAuth provider user ID
    hashed_password = Column(String, nullable=True)  # Only for email signups
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Email verification status
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    subdomains = relationship("Subdomain", back_populates="owner")
    admin_tokens = relationship("AdminToken", back_populates="user")
    email_verifications = relationship("EmailVerification", back_populates="user")

class EmailVerification(Base):
    __tablename__ = "email_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="email_verifications")

class Subdomain(Base):
    __tablename__ = "subdomains"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subdomain = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="subdomains")

class AdminToken(Base):
    __tablename__ = "admin_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="admin_tokens")
