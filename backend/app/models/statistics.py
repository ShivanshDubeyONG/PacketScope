"""Capture statistics database model for PacketScope."""

import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class CaptureStatistics(Base):
    """Aggregated analytical statistics for an analyzed PCAP capture."""

    __tablename__ = "capture_statistics"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    capture_id = Column(String(36), ForeignKey("captures.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    total_packets = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Float, nullable=False, default=0.0)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)

    total_bytes = Column(Integer, nullable=False, default=0)
    avg_packet_size = Column(Float, nullable=False, default=0.0)
    packets_per_second = Column(Float, nullable=False, default=0.0)

    unique_src_ips = Column(Integer, nullable=False, default=0)
    unique_dst_ips = Column(Integer, nullable=False, default=0)

    protocol_distribution = Column(Text, nullable=False, default="{}")  # JSON dict
    port_distribution = Column(Text, nullable=False, default="{}")  # JSON dict
    top_talkers = Column(Text, nullable=False, default="[]")  # JSON list of {ip, packet_count, byte_count}
    top_conversations = Column(Text, nullable=False, default="[]")  # JSON list of {src, dst, proto, packets, bytes}
    time_series = Column(Text, nullable=False, default="[]")  # JSON list of {timestamp, packet_count, byte_count}

    capture = relationship("Capture", back_populates="statistics")
