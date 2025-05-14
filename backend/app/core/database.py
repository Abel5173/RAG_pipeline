from .config import settings
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
import datetime
import enum

# --- Database Setup ---

DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment variables.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---


class UserRole(enum.Enum):
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    role = Column(String, nullable=True)  # Ensure this is a string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True, nullable=False)
    original_filename = Column(String, nullable=False)
    filepath = Column(String, unique=True, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="uploaded")
    version = Column(Integer, default=1)
    history = relationship("DocumentHistory", back_populates="document")


class QueryLog(Base):
    __tablename__ = "query_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    query_text = Column(String, nullable=False)
    response_text = Column(String, nullable=True)
    retrieved_context = Column(String, nullable=True)
    source_references = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("query_logs.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # e.g., 1-5
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DocumentAccessLog(Base):
    __tablename__ = "document_access_logs"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    accessed_at = Column(DateTime, default=datetime.datetime.utcnow)


class DocumentHistory(Base):
    __tablename__ = "document_history"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    version = Column(Integer, nullable=False)
    # e.g., "created", "updated", "deleted"
    change_type = Column(String, nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"),
                        nullable=False)  # User who made the change
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    # Optional field for additional details
    details = Column(String, nullable=True)

    document = relationship("Document", back_populates="history")
    user = relationship("User")  # Assuming a User model exists

# --- Database Initialization ---


def init_db():
    print("Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables checked/created.")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise


def get_db():
    """Provide a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session():
    """Provide a context-managed database session with commit/rollback."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
