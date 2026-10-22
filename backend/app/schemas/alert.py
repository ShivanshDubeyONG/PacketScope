"""Pydantic schemas for detection alerts."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AlertResponse(BaseModel):
    id: str
    capture_id: str
    rule_id: str
    title: str
    severity: str
    explanation: str
    evidence: str  # JSON-string or parsed
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    source_port: Optional[int] = None
    dest_port: Optional[int] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    event_count: int
    recommendation: str
    disclaimer: str

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    total: int
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    items: List[AlertResponse]
