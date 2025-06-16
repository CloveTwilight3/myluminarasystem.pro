from pydantic import BaseModel
from typing import Optional

class SubdomainCreate(BaseModel):
    subdomain: str

class SubdomainUpdate(BaseModel):
    subdomain: Optional[str] = None

class SubdomainResponse(BaseModel):
    id: int
    subdomain: str
    full_url: str
    created_at: str
    owner_username: str
    
    class Config:
        from_attributes = True

class AdminTokenResponse(BaseModel):
    token: str
    created_at: str
    message: str
