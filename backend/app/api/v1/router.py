"""API v1 router for PacketScope."""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import captures, exports, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(captures.router, tags=["Captures"])
api_router.include_router(exports.router, tags=["Exports"])
