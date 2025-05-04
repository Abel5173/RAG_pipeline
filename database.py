from sqlalchemy import create_engine, Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
import datetime
import enum
import os
from urllib.parse import urlparse

from .config import settings

# --- Database Setup ---

# Parse DATABASE_URL to get path
parsed_url = urlparse(settings.DATABASE_URL)
db_path = parsed_url.path
# Corrected string literals for startswith checks
if db_path.startswith(				///				):
    db_path = db_path[3:]
elif db_path.startswith(				/				):
    db_path = db_path[1:]

db_dir = os.path.dirname(db_path)
os.makedirs(db_dir, exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={				"check_same_thread"				: False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---

# Corrected: Use UPPERCASE names to match Pydantic schema
class UserRole(enum.Enum):
    STAFF = "STAFF"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Use native_enum=False to store string names (					STAFF					, 					ADMIN					)
    role = Column(SQLEnum(UserRole, name="userrole", native_enum=False), nullable=False, default=UserRole.STAFF)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True, nullable=False)
    original_filename = Column(String, nullable=False)
    filepath = Column(String, unique=True, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by_id = Column(Integer, nullable=False)
    status = Column(String, default="uploaded")

class QueryLog(Base):
    __tablename__ = "query_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    query_text = Column(String, nullable=False)
    response_text = Column(String, nullable=True)
    retrieved_context = Column(String, nullable=True)
    source_references = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# --- Database Initialization and Session Management ---

def init_db():
    print("Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables checked/created.")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_session():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

