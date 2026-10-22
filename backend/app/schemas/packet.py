"""Pydantic schemas for packet metadata and filtering."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PacketResponse(BaseModel):
    id: str
    capture_id: str
    packet_number: int
    timestamp: datetime
    relative_time: float
    source_mac: Optional[str] = None
    dest_mac: Optional[str] = None
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    ip_version: Optional[int] = None
    transport_protocol: Optional[str] = None
    source_port: Optional[int] = None
    dest_port: Optional[int] = None
    packet_length: int
    tcp_flags: Optional[str] = None
    dns_query_name: Optional[str] = None
    dns_query_type: Optional[str] = None
    http_method: Optional[str] = None
    http_host: Optional[str] = None
    http_uri: Optional[str] = None
    icmp_type: Optional[int] = None
    summary_info: Optional[str] = None

    model_config = {"from_attributes": True}


class PacketListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[PacketResponse]
