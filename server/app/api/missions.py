from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class Mission(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    story: str | None = None

missions = [
    Mission(
        id=1,
        title="Password Vault",
        description="Learn encryption and quantum threats.",
        difficulty="beginner",
        story="A system is under attack by a code-breaking adversary.",
    ),
    Mission(
        id=2,
        title="Find the Exit",
        description="Compare classical and quantum search behavior.",
        difficulty="beginner",
        story="Navigate a maze while observing search strategies side by side.",
    ),
    Mission(
        id=3,
        title="Lost Medical Breakthrough",
        description="Search massive spaces for a critical solution.",
        difficulty="intermediate",
        story="Find a medical compound among millions of possibilities.",
    ),
    Mission(
        id=4,
        title="The Supply Chain Crisis",
        description="Optimize delivery routes in a complex logistics network.",
        difficulty="intermediate",
        story="Help shipments reach their destination faster with smarter decisions.",
    ),
]

@router.get("/", response_model=List[Mission])
def get_missions(difficulty: str | None = None):
    if difficulty:
        return [mission for mission in missions if mission.difficulty == difficulty]
    return missions

@router.get("/{mission_id}", response_model=Mission)
def get_mission(mission_id: int):
    for mission in missions:
        if mission.id == mission_id:
            return mission
    raise HTTPException(status_code=404, detail="Mission not found")
