import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

from google.oauth2 import id_token
from google.auth.transport import requests

import models
import schemas
from database import get_db

# Load environment variables
load_dotenv()

# Router
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# JWT Config
SECRET_KEY = os.getenv("JWT_SECRET", "secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Password hashing
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# --------------------------------
# Password Functions
# --------------------------------

def verify_password(plain_password, hashed_password):
    if not plain_password or not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verify error: {e}")
        return False


def get_password_hash(password):
    return pwd_context.hash(password)


# --------------------------------
# JWT Token
# --------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# --------------------------------
# Get Current User
# --------------------------------

def get_current_user(token: str = Depends(oauth2_scheme)):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        email: str = payload.get("sub") or payload.get("email")

        if user_id is None or email is None:
            print(f"JWT Validation Error: Missing user_id or email in payload: {payload}")
            raise credentials_exception

        return payload

    except JWTError as e:
        print(f"JWT Validation Error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected Auth Error: {str(e)}")
        raise credentials_exception


# --------------------------------
# Google Token Verification
# --------------------------------

def verify_google_token(token: str):
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
        return idinfo
    except Exception as e:
        print(f"Google token error: {e}")
        return None


# --------------------------------
# Register API
# --------------------------------

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


# --------------------------------
# Login API
# --------------------------------

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid password")

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "user_id": db_user.id,
            "email": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        }
    }


# --------------------------------
# Google Login API
# --------------------------------

@router.post("/google")
def google_login(request: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    idinfo = verify_google_token(request.token)
    if not idinfo:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    email = idinfo.get("email")
    name = idinfo.get("name")

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        # Create new user if doesn't exist
        db_user = models.User(
            name=name,
            email=email,
            hashed_password=None,  # No password for Google users
            role="user",
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "user_id": db_user.id,
            "email": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        }
    }


# --------------------------------
# Forgot Password API
# --------------------------------

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user:
        # Don't reveal if user exists for security
        return {"message": "If this email is registered, a password reset link has been sent."}
    
    # In a real app, send email here
    return {"message": "Password reset instructions sent to your email."}