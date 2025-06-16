from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import re

from .database import get_db, engine, Base
from .routes import auth, users, subdomains
from .config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Luminara Systems API",
    description="Multi-tenant subdomain platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://myluminarasystem.pro",
        "https://*.myluminarasystem.pro",
        "http://localhost:3000",  # For development
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Subdomain detection middleware
@app.middleware("http")
async def subdomain_middleware(request: Request, call_next):
    host = request.headers.get("host", "")
    
    # Extract subdomain
    subdomain_match = re.match(r'^([^.]+)\.myluminarasystem\.pro', host)
    
    if subdomain_match:
        subdomain = subdomain_match.group(1)
        # Skip API subdomains
        if subdomain not in ["api", "www", "admin"]:
            request.state.subdomain = subdomain
        else:
            request.state.subdomain = None
    else:
        request.state.subdomain = None
    
    response = await call_next(request)
    return response

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(subdomains.router, prefix="/subdomains", tags=["Subdomains"])

@app.get("/")
async def root(request: Request):
    subdomain = getattr(request.state, 'subdomain', None)
    
    if subdomain:
        return {
            "message": f"Welcome to {subdomain}'s site",
            "subdomain": subdomain,
            "type": "user_site"
        }
    else:
        return {
            "message": "Welcome to Luminara Systems",
            "api_version": "1.0.0",
            "type": "main_site"
        }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "luminara-systems"}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "server_error"}
    )
