# Added BackgroundTasks
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import os
from typing import List, Tuple  # Added Tuple

from backend.app.core import database, dependencies, config
from backend.app.models import schemas
# Corrected import: database_models are in core.database
from backend.app.core import database as db_core
# Corrected import
from backend.app.services.document_service import get_document
from backend.app.core.database import get_db  # Import get_db
# Import the embedding function
from backend.app.services.qa_service import process_and_embed_document
from backend.app.data_access import log_document_change
from backend.app.core.database import DocumentHistory  # Corrected import
from backend.app.services.document_service import create_document  # Corrected import

router = APIRouter()


@router.post("/upload", response_model=schemas.DocumentInfo, status_code=status.HTTP_201_CREATED)
def upload_document_with_embedding(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: db_core.User = Depends(dependencies.require_admin),
    db: Session = Depends(database.get_db)
):
    allowed_extensions = {".pdf", ".txt", ".docx"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )

    os.makedirs(config.settings.UPLOAD_DIR, exist_ok=True)
    filename = file.filename
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
        status="uploaded"  # Initial status
    )
    db_doc = document_service.create_document_record(db, doc_create)

    # Trigger background task for processing and embedding
    background_tasks.add_task(
        process_and_embed_document, db_doc.id)  # Pass only doc_id
    print(f"Background task added for embedding document ID: {db_doc.id}")

    # Return the initial document info (status is still 'uploaded')
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if error:
        print(f"Warning: {error}")
    return deleted_doc


@router.put("/{doc_id}/replace")
def replace_document(doc_id: int, new_file: UploadFile, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Logic to replace the document and increment the version
    print(
        f"Replacing document with ID {doc_id} with new file: {new_file.filename}")
    # 1. Validate the new file
    allowed_extensions = {".pdf", ".txt", ".docx"}
    file_ext = os.path.splitext(new_file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    # 2. Save the new file
    os.makedirs(config.settings.UPLOAD_DIR, exist_ok=True)
    new_filepath = os.path.join(config.settings.UPLOAD_DIR, new_file.filename)
    if os.path.exists(new_filepath):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"File \"{new_file.filename}\" already exists. Please rename the file."
        )
    try:
        document_service.save_uploaded_file(new_file, new_filepath)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {e}"
        )
    # 3. Update the document record in the database
    db_doc = document_service.update_document_record(
        db, doc_id, new_filepath, new_file.filename)
    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    # 4. Process the new document in the background
    background_tasks.add_task(
        process_and_embed_document, db_doc.id)
    print(f"Background task added for embedding new document ID: {db_doc.id}")
    return {"message": "Document replaced successfully", "document": db_doc}


@router.post("/")
def create_new_document(file: UploadFile, user_id: int, db: Session = Depends(get_db)):
    # Logic to save the document
    document = create_document(db, file, user_id)

    # Log the creation
    log_document_change(
        db=db,
        document_id=document.id,
        version=1,
        change_type="created",
        changed_by=user_id,
        details=f"Document {file.filename} created."
    )
    return {"message": "Document created successfully", "document": document}


@router.put("/{doc_id}")
def update_document(doc_id: int, new_file: UploadFile, user_id: int, db: Session = Depends(get_db)):
    # Logic to update the document
    document = get_document(db, doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Increment the version
    document.version += 1
    new_filepath = os.path.join(config.settings.UPLOAD_DIR, new_file.filename)
    os.makedirs(config.settings.UPLOAD_DIR, exist_ok=True)
    try:
        document_service.save_uploaded_file(new_file, new_filepath)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {e}"
        )
    document.filepath = new_filepath
    db.commit()
    db.refresh(document)

    # Log the update
    log_document_change(
        db=db,
        document_id=doc_id,
        version=document.version,
        change_type="updated",
        changed_by=user_id,
        details=f"Document updated with new file {new_file.filename}."
    )
    return {"message": "Document updated successfully", "document": document}


@router.delete("/{doc_id}")
def delete_document(doc_id: int, user_id: int, db: Session = Depends(get_db)):
    document = get_document(db, doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the deletion
    log_document_change(
        db=db,
        document_id=doc_id,
        version=document.version,
        change_type="deleted",
        changed_by=user_id,
        details="Document deleted."
    )

    # Delete the document
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}


@router.get("/{doc_id}/history")
def get_document_history(doc_id: int, db: Session = Depends(get_db)):
    history = db.query(DocumentHistory).filter(
        DocumentHistory.document_id == doc_id).all()
    if not history:
        raise HTTPException(
            status_code=404, detail="No history found for this document")
    return {"document_id": doc_id, "history": history}
