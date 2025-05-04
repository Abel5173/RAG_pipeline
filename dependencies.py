from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core import security, database
from ..models import schemas
# Corrected import: database_models are in core.database
from ..core import database as db_core
from ..services import user_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)) -> db_core.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = security.decode_access_token(token)
    if token_data is None or token_data.username is None:
        raise credentials_exception
    user = user_service.get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: db_core.User = Depends(get_current_user)):
    if current_user.role != db_core.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def require_staff_or_admin(current_user: db_core.User = Depends(get_current_user)):
    # Both Staff and Admin can access these endpoints
    if current_user.role not in [db_core.UserRole.STAFF, db_core.UserRole.ADMIN]:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or Admin privileges required"
        )
    return current_user

