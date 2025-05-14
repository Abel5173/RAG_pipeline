from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..core import security, database
from ..models import schemas
from ..core import database as db_core
from ..services import user_service
from ..core.database import get_db, User
from ..core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_staff_or_admin(current_user: db_core.User = Depends(get_current_user)):
    # Both Staff and Admin can access these endpoints
    if current_user.role not in [db_core.UserRole.STAFF, db_core.UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or Admin privileges required"
        )
    return current_user
