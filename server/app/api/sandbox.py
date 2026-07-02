from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SandboxOption(BaseModel):
    modes: list[str]
    computerTypes: list[str]
    sizes: list[str]

sandbox_options = [
    "encryption",
    "search",
    "optimization",
]

@router.get("/options", response_model=SandboxOption)
def get_sandbox_options():
    return SandboxOption(
        modes=sandbox_options,
        computerTypes=["classical", "quantum"],
        sizes=["small", "medium", "large"],
    )
