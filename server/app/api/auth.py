from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import User
from app.db.session import get_db

router = APIRouter()
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_ALGORITHM = "HS256"
_TOKEN_EXPIRE_HOURS = 24


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    username: Optional[str] = None
    email: EmailStr
    password: str

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_and_require(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("cannot be empty")
        return v

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PatchAccountRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) < 8:
            raise ValueError("must be at least 8 characters")
        return v


class UserResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    username: str
    email: str
    username_changed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": str(user_id), "email": email, "exp": expire},
        settings.secret_key,
        algorithm=_ALGORITHM,
    )


def _get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        payload = jwt.decode(token, settings.secret_key, algorithms=[_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _unique_username(db: Session, first_name: str, last_name: str) -> str:
    base = f"{first_name.lower()}.{last_name.lower()}"
    username, counter = base, 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}{counter}"
        counter += 1
    return username


@router.post("/register", response_model=UserResponse, status_code=201)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail="An account with that email already exists")

        if payload.username:
            if db.query(User).filter(User.username == payload.username).first():
                raise HTTPException(status_code=409, detail="That username is already taken")
            username = payload.username
        else:
            username = _unique_username(db, payload.first_name, payload.last_name)

        user = User(
            first_name=payload.first_name,
            last_name=payload.last_name,
            username=username,
            email=payload.email,
            password_hash=_hash_password(payload.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")


@router.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not _verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "email": user.email,
            "token": _create_token(user.user_id, user.email),
        }
    except HTTPException:
        raise
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")


@router.post("/logout")
def logout_user():
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(_get_current_user)):
    return current_user


@router.delete("/account", status_code=200)
def delete_account(
    current_user: User = Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    try:
        db.delete(current_user)
        db.commit()
        return {"message": "Account deleted successfully"}
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")


@router.patch("/account", response_model=UserResponse)
def patch_account(
    payload: PatchAccountRequest,
    current_user: User = Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    if payload.username is None and payload.password is None and payload.email is None:
        raise HTTPException(status_code=422, detail="Provide at least one field to update")

    try:
        if payload.username is not None:
            if current_user.username_changed_at:
                days_since = (datetime.now(timezone.utc) - current_user.username_changed_at).days
                if days_since < 30:
                    days_left = 30 - days_since
                    raise HTTPException(
                        status_code=429,
                        detail=f"Username can only be changed once per month. {days_left} day{'s' if days_left != 1 else ''} remaining."
                    )
            taken = db.query(User).filter(
                User.username == payload.username,
                User.user_id != current_user.user_id,
            ).first()
            if taken:
                raise HTTPException(status_code=409, detail="That username is already taken")
            current_user.username = payload.username
            current_user.username_changed_at = datetime.now(timezone.utc)

        if payload.password is not None:
            current_user.password_hash = _hash_password(payload.password)

        if payload.email is not None:
            taken = db.query(User).filter(
                User.email == payload.email,
                User.user_id != current_user.user_id,
            ).first()
            if taken:
                raise HTTPException(status_code=409, detail="That email is already in use")
            current_user.email = payload.email

        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")
