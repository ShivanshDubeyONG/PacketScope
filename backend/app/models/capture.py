"""Capture database model for PacketScope."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Capture(Base):
    """Represents an uploaded and analyzed PCAP/PCAPNG network capture."""

    __tablename__ = "captures"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash_sha256 = Column(String(64), nullable=False, index=True)
    status = Column(String(32), default="pending", nullable=False, index=True)  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)

    packet_count = Column(Integer, default=0, nullable=False)
    duration_seconds = Column(Float, default=0.0, nullable=False)
    risk_score = Column(Integer, default=0, nullable=False)  # 0 to 100
    risk_level = Column(String(16), default="NONE", nullable=False)  # NONE, LOW, MEDIUM, HIGH, CRITICAL

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    packets = relationship("Packet", back_populates="capture", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="capture", cascade="all, delete-orphan")
    statistics = relationship("CaptureStatistics", back_populates="capture", uselist=False, cascade="all, delete-orphan")
