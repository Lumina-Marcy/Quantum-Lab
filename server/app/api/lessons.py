from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models import Lesson
from app.db.session import get_db

router = APIRouter()


class LessonLink(BaseModel):
    label: str
    url: str


class LessonResponse(BaseModel):
    id: str
    title: str
    category: str
    summary: str
    video_id: str = Field(alias="videoId")
    duration: Optional[str] = None
    links: list[LessonLink] = Field(default_factory=list)
    interactive: Optional[str] = None

    model_config = {"from_attributes": True, "populate_by_name": True}


@router.get("", response_model=list[LessonResponse])
def get_lessons(db: Session = Depends(get_db)):
    try:
        return db.query(Lesson).order_by(Lesson.title).all()
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")


@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: str, db: Session = Depends(get_db)):
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
