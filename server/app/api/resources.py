from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ResourceItem(BaseModel):
    title: str
    type: str

class LearningResources(BaseModel):
    intro: str
    topics: list[ResourceItem]
    glossary: list[str]

@router.get("", response_model=LearningResources)
def get_resources():
    return LearningResources(
        intro="Learn quantum computing basics through visual stories and simulations.",
        topics=[
            ResourceItem(title="What is a Qubit?", type="article"),
            ResourceItem(title="Superposition Explained", type="video"),
            ResourceItem(title="Quantum Search vs Classical Search", type="article"),
        ],
        glossary=["qubit", "entanglement", "superposition", "quantum advantage"],
    )
