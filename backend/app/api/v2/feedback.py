from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.schemas import FeedbackCreate, FeedbackResponse
from backend.app.data_access import log_feedback

router = APIRouter()


@router.post("/", response_model=FeedbackResponse)
def submit_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    return log_feedback(db, feedback)
