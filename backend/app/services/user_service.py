from sqlalchemy.orm import Session
from typing import Optional

from ..core import security
# Corrected import: database_models are in core.database
from ..core import database as db_core
from ..models import schemas

def get_user(db: Session, username: str) -> Optional[db_core.User]:
    return db.query(db_core.User).filter(db_core.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate) -> db_core.User:
    hashed_password = security.get_password_hash(user.password)
    db_user = db_core.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str) -> Optional[db_core.User]:
    user = get_user(db, username)
    if not user:
        return None
    if not security.verify_password(password, user.hashed_password):
        return None
    return user

