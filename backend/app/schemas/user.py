from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    default_address: Optional[str] = None

# Properties to receive via API on registration
class UserCreate(UserBase):
    password: str

# Properties to receive via API on login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Properties to receive via API on profile update
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    default_address: Optional[str] = None
    password: Optional[str] = None

# Properties to return via API
class UserOut(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# JWT Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
