from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.app.core import security, database
from backend.app.models import schemas
# Corrected import: database_models are in core.database
from backend.app.core import database as db_core
from backend.app.services import user_service
from backend.app.core import dependencies  # Import dependencies

router = APIRouter()


@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # Use db_core.User for type hint if needed, but service handles it
    user = user_service.authenticate_user(
        db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(
        # Include role in token data
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/reset-password")
def reset_password(email: str, db: Session = Depends(database.get_db)):
    user = db.query(db_core.User).filter(db_core.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    reset_token = security.create_access_token(
        {"sub": user.id}, expires_delta=timedelta(hours=1))
    # Send reset_token via email (mocked here)
    print(f"Password reset token for {email}: {reset_token}")
    return {"message": "Password reset token sent"}


@router.post("/change-password")
def change_password(token: str, new_password: str, db: Session = Depends(database.get_db)):
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(db_core.User).filter(
        db_core.User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = security.hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if the username already exists
    existing_user = user_service.get_user(db, user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    # Create the user
    new_user = user_service.create_user(db, user)
    return new_user


@router.post("/signin", response_model=schemas.Token)
def signin(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = user_service.authenticate_user(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/password-reset")
def request_password_reset(email: str, db: Session = Depends(database.get_db)):
    user = db.query(db_core.User).filter(db_core.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    reset_token = security.create_access_token(
        {"sub": user.username}, expires_delta=timedelta(hours=1)
    )
    # Send reset_token via email (mocked here)
    print(f"Password reset token for {email}: {reset_token}")
    return {"message": "Password reset token sent"}


@router.post("/password-change")
def change_password(
    token: str, new_password: str, db: Session = Depends(database.get_db)
):
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(db_core.User).filter(
        db_core.User.username == payload.get("sub")
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = security.hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.put("/profile", response_model=schemas.User)
def update_profile(
    user_update: schemas.UserCreate,
    current_user: db_core.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db),
):
    current_user.username = user_update.username
    current_user.hashed_password = security.hash_password(user_update.password)
    db.commit()
    db.refresh(current_user)
    return current_user
