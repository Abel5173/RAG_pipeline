from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core import database, dependencies
# Corrected import: Use db_core for models, schemas are in models
from ..core import database as db_core
from ..models import schemas
from ..services import qa_service

router = APIRouter()

@router.post("/query", response_model=schemas.QueryResponse)
def ask_question(
    query: schemas.QueryRequest,
    current_user: db_core.User = Depends(dependencies.require_staff_or_admin),
    db: Session = Depends(database.get_db)
):
    """Receives a question, performs RAG, returns answer and sources."""
    try:
        answer, sources = qa_service.process_query_with_rag(query.query_text)

        # Log the query and response
        qa_service.log_query(
            db=db,
            user_id=current_user.id,
            query_text=query.query_text,
            response_text=answer,
            source_references=sources
        )

        return schemas.QueryResponse(answer=answer, sources=sources)

    except Exception as e:
        # Log the error query attempt if needed
        qa_service.log_query(
            db=db,
            user_id=current_user.id,
            query_text=query.query_text,
            response_text=f"Error: {e}",
            source_references="N/A"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during query processing: {e}"
        )

@router.get("/history", response_model=List[schemas.QueryLogInfo])
def get_query_history(
    skip: int = 0,
    limit: int = 100,
    current_user: db_core.User = Depends(dependencies.require_staff_or_admin),
    db: Session = Depends(database.get_db)
):
    """Retrieves the query history for the current user."""
    history = qa_service.get_user_query_history(db, user_id=current_user.id, skip=skip, limit=limit)
    return history

@router.get("/history/all", response_model=List[schemas.QueryLogInfo])
def get_all_query_history(
    skip: int = 0,
    limit: int = 1000,
    current_user: db_core.User = Depends(dependencies.require_admin), # Admin only
    db: Session = Depends(database.get_db)
):
    """Retrieves all query logs (Admin only)."""
    history = qa_service.get_all_query_logs(db, skip=skip, limit=limit)
    return history

