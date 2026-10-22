"""Export schemas."""

from typing import Any, Dict, List
from pydantic import BaseModel
from backend.app.schemas.capture import CaptureResponse
from backend.app.schemas.alert import AlertResponse


class ExportSummaryResponse(BaseModel):
    capture: CaptureResponse
    statistics: Dict[str, Any]
    alerts_summary: Dict[str, Any]
    alerts: List[AlertResponse]
    disclaimer: str = (
        "PacketScope defensive export. Contains metadata and heuristic detection alerts only. "
        "No packet payload or credential content is stored or transmitted."
    )
