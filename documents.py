from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks # Added BackgroundTasks
from sqlalchemy.orm import Session
import os
from typing import List, Tuple # Added Tuple

from ..core import database, dependencies, config
from ..models import schemas
# Corrected import: database_models are in core.database
from ..core import database as db_core
from ..services import document_service
from ..services.qa_service import process_and_embed_document # Import the embedding function

router = APIRouter()

@router.post("/upload", response_model=schemas.DocumentInfo, status_code=status.HTTP_201_CREATED)
def upload_document_with_embedding(
    # Corrected argument order: non-default args first
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: db_core.User = Depends(dependencies.require_admin),
    db: Session = Depends(database.get_db)
):
    """Uploads a document and triggers background embedding. Admin only."""
    allowed_extensions = {".pdf", ".txt", ".docx"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        # Corrected f-string syntax (ensured closing brace is present)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )

    os.makedirs(config.settings.UPLOAD_DIR, exist_ok=True)
    # Use a safer filename approach (e.g., UUID) in production
    filename = file.filename # WARNING: Potential security risk
    filepath = os.path.join(config.settings.UPLOAD_DIR, filename)

    if os.path.exists(filepath):
         # Overwrite option or reject? Rejecting for now.
         raise HTTPException(
             status_code=status.HTTP_409_CONFLICT,
             detail=f"File \"{filename}\" already exists. Delete the existing document first if you want to re-upload."
         )

    try:
        document_service.save_uploaded_file(file, filepath)
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {e}"
        )

    doc_create = schemas.DocumentCreate(
        filename=filename,
        original_filename=file.filename,
        filepath=filepath,
        uploaded_by_id=current_user.id,
        status="uploaded" # Initial status
    )
    db_doc = document_service.create_document_record(db, doc_create)

    # Trigger background task for processing and embedding
    background_tasks.add_task(process_and_embed_document, db_doc.id) # Pass only doc_id
    print(f"Background task added for embedding document ID: {db_doc.id}")

    # Return the initial document info (status is still \'uploaded\')
    return db_doc

@router.get("/", response_model=List[schemas.DocumentInfo])
def list_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: db_core.User = Depends(dependencies.require_admin),
    db: Session = Depends(database.get_db)
):
    """Lists uploaded documents. Admin only."""
    documents = document_service.get_documents(db, skip=skip, limit=limit)
    return documents

@router.delete("/{doc_id}", response_model=schemas.DocumentInfo)
def delete_document(
    doc_id: int,
    current_user: db_core.User = Depends(dependencies.require_admin),
    db: Session = Depends(database.get_db)
):
    """Deletes a document and its record. Admin only."""
    # TODO: Need to also delete associated embeddings from FAISS
    deleted_doc, error = document_service.delete_document_record(db, doc_id)
    if not deleted_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if error:
        print(f"Warning: {error}")
    return deleted_doc

