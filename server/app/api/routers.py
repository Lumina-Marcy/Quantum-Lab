from fastapi import APIRouter
from app.api import missions, sandbox, resources, auth, lessons, ai

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(missions.router, prefix="/missions", tags=["missions"])
api_router.include_router(sandbox.router, prefix="/sandbox", tags=["sandbox"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
