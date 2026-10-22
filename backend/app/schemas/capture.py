"""Pydantic schemas for network capture metadata and responses."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CaptureBase(BaseModel):
    filename: str
    original_filename: str
    file_size: int
    packet_count: int = 0
    duration_seconds: float = 0.0
    risk_score: int = 0
    risk_level: str = "NONE"


class CaptureStatusResponse(BaseModel):
    id: str
    status: str
    packet_count: int
    duration_seconds: float
    risk_score: int
    risk_level: str
    error_message: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None


class CaptureResponse(CaptureBase):
    id: str
    status: str
    error_message: Optional[str] = None
    file_hash_sha256: str
    created_at: datetime
    processed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CaptureListResponse(BaseModel):
    total: int
    items: List[CaptureResponse]
