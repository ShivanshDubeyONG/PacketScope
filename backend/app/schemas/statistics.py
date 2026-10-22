"""Pydantic schemas for capture statistics."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TopTalkerItem(BaseModel):
    ip: str
    packet_count: int
    byte_count: int
    role: str = "endpoint"


class TopConversationItem(BaseModel):
    source_ip: str
    dest_ip: str
    protocol: str
    packet_count: int
    byte_count: int


class TimeSeriesItem(BaseModel):
    timestamp: str
    packet_count: int
    byte_count: int


class StatisticsResponse(BaseModel):
    id: str
    capture_id: str
    total_packets: int
    duration_seconds: float
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_bytes: int
    avg_packet_size: float
    packets_per_second: float
    unique_src_ips: int
    unique_dst_ips: int
    protocol_distribution: Dict[str, int]
    port_distribution: Dict[str, int]
    top_talkers: List[TopTalkerItem]
    top_conversations: List[TopConversationItem]
    time_series: List[TimeSeriesItem]

    model_config = {"from_attributes": True}
