from sqlalchemy.orm import Session
from fastapi import UploadFile
import shutil
import os
from typing import List, Optional, Tuple
import pymupdf
from ..core.config import settings
from ..core import database as db_core
from ..models import schemas
from backend.app.models.schemas import DocumentCreate
from backend.app.core.database import Document


def save_uploaded_file(upload_file: UploadFile, destination: str) -> None:
    """Saves the uploaded file to the specified destination."""
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()


def extract_text_from_file(filepath: str) -> str:
    """Extracts text content from PDF, DOCX, or TXT files."""
    _, file_extension = os.path.splitext(filepath)
    text = ""

    try:
        if file_extension.lower() == ".pdf":
            doc = pymupdf.open(filepath)
            for page in doc:
                text += page.get_text()
            doc.close()
        # elif file_extension.lower() in [".docx", ".txt"]:
        #     # Use unstructured for DOCX and TXT
        #     elements = partition(filename=filepath)
        #     text = "\n\n".join([str(el) for el in elements])
        else:
            print(
                f"Unsupported file type for text extraction: {file_extension}")
            raise ValueError(f"Unsupported file type: {file_extension}")
    except Exception as e:
        print(f"Error extracting text from {filepath}: {e}")
        raise

    return text


def create_document_record(db: Session, doc: schemas.DocumentCreate) -> db_core.Document:
    """Creates a document record in the database."""
    db_doc = db_core.Document(
        **doc.model_dump())  # Use model_dump() for Pydantic v2
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


def get_documents(db: Session, skip: int = 0, limit: int = 100) -> List[db_core.Document]:
    """Retrieves a list of document records."""
    return db.query(db_core.Document).order_by(db_core.Document.uploaded_at.desc()).offset(skip).limit(limit).all()


def get_document(db: Session, doc_id: int) -> Optional[db_core.Document]:
    """Retrieves a single document record by ID."""
    return db.query(db_core.Document).filter(db_core.Document.id == doc_id).first()


def delete_document_record(db: Session, doc_id: int) -> Tuple[Optional[db_core.Document], Optional[str]]:
    """Deletes a document record and its associated file."""
    db_doc = get_document(db, doc_id)
    if db_doc:
        file_deletion_error = None
        if os.path.exists(db_doc.filepath):
            try:
                os.remove(db_doc.filepath)
            except OSError as e:
                file_deletion_error = f"Error deleting file {db_doc.filepath}: {e}"
        db.delete(db_doc)
        db.commit()
        return db_doc, file_deletion_error
    return None, None


def update_document_status(db: Session, doc_id: int, status: str) -> Optional[db_core.Document]:
    """Updates the status of a document record."""
    db_doc = get_document(db, doc_id)
    if db_doc:
        db_doc.status = status
        db.commit()
        db.refresh(db_doc)
        return db_doc
    return None


def create_document(db: Session, document: DocumentCreate) -> Document:
    """Creates a new document in the database."""
    db_document = Document(**document.dict())
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document
