import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a_very_secret_key_that_should_be_in_env")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Corrected: Use synchronous pysqlite driver
    DATABASE_URL: str = "sqlite+pysqlite:///../data/database/rag_app.db"
    UPLOAD_DIR: str = "/home/ubuntu/rag_app/backend/data/uploads"
    VECTOR_STORE_DIR: str = "/home/ubuntu/rag_app/backend/data/vector_store"

    class Config:
        env_file = "/home/ubuntu/rag_app/.env"

settings = Settings()


