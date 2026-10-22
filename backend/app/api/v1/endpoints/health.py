"""Health check endpoint for PacketScope."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import get_db

router = APIRouter()


@router.get("/health", summary="Service health and readiness check")
def get_health(db: Session = Depends(get_db)):
    """Return health status, database connectivity, and TShark binary availability."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    tshark_path = settings.resolved_tshark_path
    tshark_available = tshark_path is not None

    return {
        "status": "ok" if (db_ok and tshark_available) else "degraded",
        "service": "PacketScope Network Traffic Analysis Platform",
        "database": "connected" if db_ok else "unreachable",
        "tshark": {
            "available": tshark_available,
            "path": tshark_path or "Not found",
        },
        "environment": settings.ENV,
    }
