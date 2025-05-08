# What this file does:
# 1. Defines API endpoints for querying and retrieving query history.
# 2. Implements the logic for processing queries using RAG.
# 3. Handles logging of queries and responses.
# 4. Provides endpoints for both user-specific and admin-specific query history retrieval.
# 5. Uses FastAPI for creating the API and SQLAlchemy for database interactions.
# 6. Utilizes Pydantic for data validation and serialization.
# 7. Implements error handling for query processing.
# 8. Ensures that only authorized users can access certain endpoints.
# 9. Uses dependency injection for database sessions and user authentication.
# 10. Provides a structured response format for API endpoints.


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.core import database, dependencies
from backend.app.core import database as db_core
from backend.app.models import schemas
from backend.app.services import qa_service

# Create a router for the QA endpoints
router = APIRouter()

# Endpoint to process a query using RAG
@router.post("/query", response_model=schemas.QueryResponse)
def ask_question(
    query: schemas.QueryRequest, # Request body containing the query text
    current_user: db_core.User = Depends(dependencies.require_staff_or_admin), # Dependency to get the current user
    db: Session = Depends(database.get_db) # Dependency to get the database session
):
    """Receives a question, performs RAG, returns answer and sources."""
    try:
        answer, sources = qa_service.process_query_with_rag(query.query_text) # Process the query using RAG
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No answer found for the provided query."
            )
        if not sources:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No sources found for the provided query."
            )

        # Log the query attempt with the answer and sources
        qa_service.log_query(
            db=db, 
            user_id=current_user.id,
            query_text=query.query_text,
            response_text=answer,
            source_references=sources
        )

        print(f"{answer} \n{sources}")

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

# Endpoint to retrieve the query history for the current user
@router.get("/history", response_model=List[schemas.QueryLogInfo])
def get_query_history(
    skip: int = 0, # Offset for pagination
    limit: int = 100, # Limit for pagination
    current_user: db_core.User = Depends(dependencies.require_staff_or_admin), # Dependency to get the current user
    db: Session = Depends(database.get_db) # Dependency to get the database session
):
    """Retrieves the query history for the current user."""
    history = qa_service.get_user_query_history(db, user_id=current_user.id, skip=skip, limit=limit)
    return history

# Endpoint to retrieve all query logs (Admin only)
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

