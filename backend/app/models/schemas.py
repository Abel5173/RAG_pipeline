from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import enum

# Enum for User Roles (matches database model - Use UPPERCASE names)


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"  # Use uppercase value matching name
    STAFF = "STAFF"  # Use uppercase value matching name

# --- User Schemas ---


class UserBase(BaseModel):
    username: str
    role: UserRole  # Pydantic will validate against ADMIN/STAFF


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Use orm_mode in Pydantic v1

# --- Token Schemas ---


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None

# --- Document Schemas ---


class DocumentBase(BaseModel):
    original_filename: str
    status: Optional[str] = "uploaded"


class DocumentCreate(DocumentBase):
    filename: str
    filepath: str
    uploaded_by_id: int


class DocumentInfo(DocumentBase):
    id: int
    uploaded_at: datetime
    uploaded_by_id: int

    class Config:
        from_attributes = True

# --- Query Schemas ---


class QueryRequest(BaseModel):
    query_text: str


class QueryLogBase(BaseModel):
    query_text: str
    response_text: Optional[str] = None
    source_references: Optional[str] = None
    timestamp: datetime


class QueryLogInfo(QueryLogBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class QueryResponse(BaseModel):
    response_text: str  # Changed from answer to match qa_service
    source_references: Optional[str] = None
    # query_log_id: int # Removed, log happens in endpoint


class FeedbackCreate(BaseModel):
    query_id: int
    rating: int  # e.g., 1-5
    comment: Optional[str] = None
