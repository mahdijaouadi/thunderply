from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.src.config.settings import settings
from backend.src.adapters.inbound.api.v1.router import api_router
import os
from backend.src.config.logging import setup_logging


setup_logging()
current_dir = os.path.dirname(os.path.abspath(__file__))
app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["health"])
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})

app.include_router(api_router, prefix=settings.api_v1_prefix) 