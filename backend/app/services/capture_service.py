"""Capture orchestration and lifecycle service."""

import hashlib
import json
import os
import re
import shutil
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import UploadFile
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.exceptions import (
    CaptureNotFoundError,
    CaptureProcessingError,
    FileTooLargeError,
    InvalidCaptureFileError,
    TSharkNotFoundError,
)
from backend.app.core.logging import logger
from backend.app.models.alert import Alert
from backend.app.models.capture import Capture
from backend.app.models.packet import Packet
from backend.app.models.statistics import CaptureStatistics
from backend.app.services.detection_engine import calculate_risk_score, evaluate_rules
from backend.app.services.pcap_parser import parse_pcap_file, validate_capture_file
from backend.app.services.stats_calculator import calculate_capture_statistics


def sanitize_filename(filename: str) -> str:
    """Sanitize user-provided filename to prevent path traversal or filesystem abuse."""
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r"[^\w\.\-]", "_", clean_name)
    return clean_name or "capture.pcap"


class CaptureService:
    @staticmethod
    def list_captures(db: Session, skip: int = 0, limit: int = 50) -> Tuple[int, List[Capture]]:
        total = db.query(Capture).count()
        items = db.query(Capture).order_by(Capture.created_at.desc()).offset(skip).limit(limit).all()
        return total, items

    @staticmethod
    def get_capture(db: Session, capture_id: str) -> Capture:
        capture = db.query(Capture).filter(Capture.id == capture_id).first()
        if not capture:
            raise CaptureNotFoundError(capture_id)
        return capture

    @staticmethod
    def process_capture_file(db: Session, capture_id: str) -> Capture:
        capture = CaptureService.get_capture(db, capture_id)
        capture.status = "processing"
        db.commit()

        try:
            logger.info("Beginning processing for capture %s (%s)", capture_id, capture.file_path)
            # Parse packets via PyShark/TShark
            parsed_packets = parse_pcap_file(capture.file_path)

            if not parsed_packets:
                logger.warning("Capture %s contained no readable packets.", capture_id)

            # Compute capture-level statistics
            stats_dict = calculate_capture_statistics(parsed_packets)

            # Run deterministic detection rules
            alert_dicts = evaluate_rules(parsed_packets)
            risk_score, risk_level = calculate_risk_score(alert_dicts)

            # Update capture record
            capture.packet_count = len(parsed_packets)
            capture.duration_seconds = stats_dict.get("duration_seconds", 0.0)
            capture.risk_score = risk_score
            capture.risk_level = risk_level
            capture.status = "completed"
            capture.processed_at = datetime.now(timezone.utc)

            # Save statistics model
            stats_model = CaptureStatistics(
                capture_id=capture.id,
                total_packets=stats_dict["total_packets"],
                duration_seconds=stats_dict["duration_seconds"],
                start_time=stats_dict["start_time"],
                end_time=stats_dict["end_time"],
                total_bytes=stats_dict["total_bytes"],
                avg_packet_size=stats_dict["avg_packet_size"],
                packets_per_second=stats_dict["packets_per_second"],
                unique_src_ips=stats_dict["unique_src_ips"],
                unique_dst_ips=stats_dict["unique_dst_ips"],
                protocol_distribution=json.dumps(stats_dict["protocol_distribution"]),
                port_distribution=json.dumps(stats_dict["port_distribution"]),
                top_talkers=json.dumps(stats_dict["top_talkers"]),
                top_conversations=json.dumps(stats_dict["top_conversations"]),
                time_series=json.dumps(stats_dict["time_series"]),
            )
            db.add(stats_model)

            # Save alerts
            for a in alert_dicts:
                alert_model = Alert(
                    capture_id=capture.id,
                    rule_id=a["rule_id"],
                    title=a["title"],
                    severity=a["severity"],
                    explanation=a["explanation"],
                    evidence=a["evidence"],
                    source_ip=a["source_ip"],
                    dest_ip=a["dest_ip"],
                    source_port=a["source_port"],
                    dest_port=a["dest_port"],
                    first_seen=a["first_seen"],
                    last_seen=a["last_seen"],
                    event_count=a["event_count"],
                    recommendation=a["recommendation"],
                    disclaimer=a["disclaimer"],
                )
                db.add(alert_model)

            # Batch insert packet records
            packet_records = []
            for p in parsed_packets:
                packet_records.append(
                    Packet(
                        capture_id=capture.id,
                        packet_number=p["packet_number"],
                        timestamp=p["timestamp"],
                        relative_time=p["relative_time"],
                        source_mac=p["source_mac"],
                        dest_mac=p["dest_mac"],
                        source_ip=p["source_ip"],
                        dest_ip=p["dest_ip"],
                        ip_version=p["ip_version"],
                        transport_protocol=p["transport_protocol"],
                        source_port=p["source_port"],
                        dest_port=p["dest_port"],
                        packet_length=p["packet_length"],
                        tcp_flags=p["tcp_flags"],
                        dns_query_name=p["dns_query_name"],
                        dns_query_type=p["dns_query_type"],
                        http_method=p["http_method"],
                        http_host=p["http_host"],
                        http_uri=p["http_uri"],
                        icmp_type=p["icmp_type"],
                        summary_info=p["summary_info"],
                    )
                )

            # Commit in batches of 1000 if large
            if packet_records:
                db.bulk_save_objects(packet_records)

            db.commit()
            db.refresh(capture)
            logger.info("Processing complete for capture %s with risk score %d (%s)", capture_id, risk_score, risk_level)
            return capture

        except (InvalidCaptureFileError, TSharkNotFoundError) as exc:
            db.rollback()
            capture.status = "failed"
            capture.error_message = exc.message
            db.commit()
            logger.error("Capture %s failed validation or TShark check: %s", capture_id, exc.message)
            raise exc
        except Exception as exc:
            db.rollback()
            capture.status = "failed"
            capture.error_message = f"Analysis error: {str(exc)}"
            db.commit()
            logger.exception("Unexpected error processing capture %s: %s", capture_id, exc)
            raise CaptureProcessingError(f"Failed to process capture: {str(exc)}")

    @staticmethod
    async def save_uploaded_capture(db: Session, upload_file: UploadFile) -> Capture:
        """Validate, hash, and persist uploaded capture file."""
        orig_name = upload_file.filename or "capture.pcap"
        sanitized_name = sanitize_filename(orig_name)
        ext = os.path.splitext(sanitized_name)[1].lower()

        if ext not in [".pcap", ".pcapng"]:
            raise InvalidCaptureFileError(
                f"Unsupported file format '{ext}'. PacketScope only supports standard '.pcap' and '.pcapng' captures."
            )

        capture_id = str(uuid.uuid4())
        stored_filename = f"{capture_id}{ext}"
        destination_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        sha256 = hashlib.sha256()
        total_bytes = 0

        try:
            with open(destination_path, "wb") as f_out:
                while True:
                    chunk = await upload_file.read(1024 * 64)  # 64KB chunk
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        raise FileTooLargeError(
                            size_mb=total_bytes / (1024 * 1024),
                            max_mb=settings.MAX_UPLOAD_SIZE_MB,
                        )
                    sha256.update(chunk)
                    f_out.write(chunk)
        except Exception as exc:
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise exc

        if total_bytes == 0:
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise InvalidCaptureFileError("Uploaded file is empty (0 bytes).")

        # Validate magic byte header
        try:
            validate_capture_file(destination_path)
        except InvalidCaptureFileError as exc:
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise exc

        capture = Capture(
            id=capture_id,
            filename=stored_filename,
            original_filename=orig_name,
            file_path=destination_path,
            file_size=total_bytes,
            file_hash_sha256=sha256.hexdigest(),
            status="pending",
        )
        db.add(capture)
        db.commit()
        db.refresh(capture)
        return capture
