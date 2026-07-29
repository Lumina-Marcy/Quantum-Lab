from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models import Mission
from app.db.session import get_db

router = APIRouter()


class MissionResponse(BaseModel):
    mission_id: str = Field(alias="id")
    title: str
    description: str = Field(alias="summary")
    difficulty: str
    estimated_time: str = Field(alias="estimatedTime")
    status: str
    terminal_lines: list[str] = Field(default_factory=list, alias="terminalLines")

    # `mission_id` is an integer PK in the DB, but the frontend routes/compares on it as a string
    # ("/mission/3", `useParams().id`) — Pydantic's lax mode does NOT coerce int -> str on its own
    # (verified: it raises `string_type` without this), so it needs an explicit conversion.
    @field_validator("mission_id", mode="before")
    @classmethod
    def stringify_id(cls, value):
        return str(value)

    model_config = {"from_attributes": True, "populate_by_name": True}


@router.get("", response_model=list[MissionResponse])
def get_missions(difficulty: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(Mission)
        if difficulty:
            query = query.filter(Mission.difficulty == difficulty)
        return query.order_by(Mission.mission_id).all()
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")


@router.get("/{mission_id}", response_model=MissionResponse)
def get_mission(mission_id: int, db: Session = Depends(get_db)):
    try:
        mission = db.query(Mission).filter(Mission.mission_id == mission_id).first()
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="A server error occurred. Please try again later.")
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission
