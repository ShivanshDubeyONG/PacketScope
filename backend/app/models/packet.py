"""Packet metadata database model for PacketScope."""

import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Packet(Base):
    """Stores extracted, non-sensitive packet metadata."""

    __tablename__ = "packets"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    capture_id = Column(String(36), ForeignKey("captures.id", ondelete="CASCADE"), nullable=False, index=True)
    packet_number = Column(Integer, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    relative_time = Column(Float, nullable=False, default=0.0)

    source_mac = Column(String(32), nullable=True)
    dest_mac = Column(String(32), nullable=True)

    source_ip = Column(String(64), nullable=True, index=True)
    dest_ip = Column(String(64), nullable=True, index=True)
    ip_version = Column(Integer, nullable=True)  # 4 or 6

    transport_protocol = Column(String(16), nullable=True, index=True)  # TCP, UDP, ICMP, DNS, HTTP, etc.
    source_port = Column(Integer, nullable=True, index=True)
    dest_port = Column(Integer, nullable=True, index=True)

    packet_length = Column(Integer, nullable=False, default=0)
    tcp_flags = Column(String(32), nullable=True)

    # Application protocol metadata
    dns_query_name = Column(String(255), nullable=True)
    dns_query_type = Column(String(16), nullable=True)
    http_method = Column(String(16), nullable=True)
    http_host = Column(String(255), nullable=True)
    http_uri = Column(String(512), nullable=True)
    icmp_type = Column(Integer, nullable=True)

    summary_info = Column(String(512), nullable=True)

    capture = relationship("Capture", back_populates="packets")

    __table_args__ = (
        Index("idx_packets_cap_proto", "capture_id", "transport_protocol"),
        Index("idx_packets_cap_src_dst", "capture_id", "source_ip", "dest_ip"),
    )
