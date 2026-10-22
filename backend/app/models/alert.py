"""Detection alert database model for PacketScope."""

import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Alert(Base):
    """Represents a rule-triggered defensive security alert with transparent evidence."""

    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    capture_id = Column(String(36), ForeignKey("captures.id", ondelete="CASCADE"), nullable=False, index=True)

    rule_id = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(16), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL

    explanation = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)  # JSON-encoded dictionary of evidence

    source_ip = Column(String(64), nullable=True, index=True)
    dest_ip = Column(String(64), nullable=True, index=True)
    source_port = Column(Integer, nullable=True)
    dest_port = Column(Integer, nullable=True)

    first_seen = Column(DateTime(timezone=True), nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    event_count = Column(Integer, default=1, nullable=False)

    recommendation = Column(Text, nullable=False)
    disclaimer = Column(
        Text,
        default="This alert indicates suspicious traffic behavior based on deterministic rule heuristics, not confirmed compromise.",
        nullable=False,
    )

    capture = relationship("Capture", back_populates="alerts")

    __table_args__ = (
        Index("idx_alerts_cap_sev", "capture_id", "severity"),
    )
