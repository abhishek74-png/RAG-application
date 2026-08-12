from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    # Mock authentication
    if request.email and request.password:
        return {"access_token": "mock-jwt-token", "token_type": "bearer", "user": {"name": "Alex Morgan", "email": request.email}}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/register")
def register(request: RegisterRequest):
    # Mock registration
    return {"message": "User created successfully"}
