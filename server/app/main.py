from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routers

app = FastAPI(
    title="Quantum Lab API",
    description="Backend API for the Quantum Lab interactive learning platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.api_router)
