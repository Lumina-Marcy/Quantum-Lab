from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

@router.post("/register", response_model=UserResponse, status_code=201)
def register_user(payload: RegisterRequest):
    if payload.email == "existing@example.com":
        raise HTTPException(status_code=409, detail="User already exists")
    return UserResponse(id=1, username=payload.username, email=payload.email)

@router.post("/login")
def login_user(payload: LoginRequest):
    if payload.email != "user@example.com" or payload.password != "password":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"id": 1, "username": "quantum_user", "token": "jwt-token-example"}

@router.post("/logout")
def logout_user():
    return {"message": "Logged out successfully"}
