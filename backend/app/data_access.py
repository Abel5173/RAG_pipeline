from sqlalchemy.orm import Session
from .core.database import QueryLog, Document, Feedback
from .models.schemas import FeedbackCreate
from .core.database import DocumentHistory


def update_document_status(db: Session, doc_id: int, status: str):
    """Updates the status of a document."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        doc.status = status
        db.commit()
        db.refresh(doc)
    return doc


def log_query(
    db: Session,
    user_id: int,
    query_text: str,
    response_text: str = None,
    retrieved_context: str = None,
    source_references: str = None
) -> QueryLog:
    """Logs a query and its response details to the database."""
    db_log = QueryLog(
        user_id=user_id,
        query_text=query_text,
        response_text=response_text,
        retrieved_context=retrieved_context,
        source_references=source_references
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def get_document(db: Session, doc_id: int) -> Document:
    """Retrieves a document by its ID."""
    return db.query(Document).filter(Document.id == doc_id).first()


def log_feedback(db: Session, feedback_data: FeedbackCreate):
    feedback = Feedback(**feedback_data.dict())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def log_document_change(
    db: Session,
    document_id: int,
    version: int,
    change_type: str,
    changed_by: int,
    details: str = None
):
    """Logs a change to the document history."""
    history_entry = DocumentHistory(
        document_id=document_id,
        version=version,
        change_type=change_type,
        changed_by=changed_by,
        details=details
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)
    return history_entry
