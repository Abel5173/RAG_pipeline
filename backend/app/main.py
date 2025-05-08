from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core import database 
import backend.app.api.v2.auth as auth, backend.app.api.v2.documents as documents, backend.app.api.v2.qa as qa
from .services import user_service 
from .core import database as db_core
from .models import schemas
from .core import security

# Initialize database tables
db_core.init_db() 

# --- Create default users if not exists ---
def create_initial_users():
    # Use a context manager for the session
    with db_core.SessionLocal() as db:
        # Admin User
        admin_username = "admin"
        if not user_service.get_user(db, admin_username):
            print("Creating default admin user...")
            default_password = "adminpass"
            admin_user_data = schemas.UserCreate(
                username=admin_username,
                password=default_password,
                # Corrected: Use Enum member directly
                role=db_core.UserRole.ADMIN
            )
            user_service.create_user(db, admin_user_data)
            print(f"Default admin user created (username: {admin_username}, password: {default_password})")
        else:
            print("Admin user already exists.")

        # Staff User
        staff_username = "staff"
        if not user_service.get_user(db, staff_username):
            print("Creating default staff user...")
            default_password = "staffpass"
            staff_user_data = schemas.UserCreate(
                username=staff_username,
                password=default_password,
                # Corrected: Use Enum member directly
                role=db_core.UserRole.STAFF
            )
            user_service.create_user(db, staff_user_data)
            print(f"Default staff user created (username: {staff_username}, password: {default_password})")
        else:
            print("Staff user already exists.")

create_initial_users()

app = FastAPI(title="Local RAG Application API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins for local dev
    allow_credentials=True, # Allows credentials like cookies, authorization headers, etc.
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(qa.router, prefix="/api/v1/qa", tags=["Q&A"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Local RAG Application API"}


