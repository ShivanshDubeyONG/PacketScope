"""Export endpoints for XML, SQLite, CSV, and JSON formats."""

import csv
import io
import json
import os
import tempfile
from fastapi import APIRouter, Depends, Response
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.alert import Alert
from backend.app.models.capture import Capture
from backend.app.models.packet import Packet
from backend.app.models.statistics import CaptureStatistics
from backend.app.schemas.export import ExportSummaryResponse
from backend.app.services.capture_service import CaptureService
from backend.app.services.sqlite_exporter import export_capture_to_sqlite
from backend.app.services.xml_exporter import generate_capture_xml

router = APIRouter()


@router.get(
    "/captures/{capture_id}/exports/xml",
    summary="Export capture analysis as structured XML",
)
def export_xml(capture_id: str, db: Session = Depends(get_db)):
    capture = CaptureService.get_capture(db, capture_id)
    stats = db.query(CaptureStatistics).filter(CaptureStatistics.capture_id == capture_id).first()
    alerts = db.query(Alert).filter(Alert.capture_id == capture_id).all()
    packets = db.query(Packet).filter(Packet.capture_id == capture_id).order_by(Packet.packet_number.asc()).all()

    xml_content = generate_capture_xml(capture, stats, alerts, packets)
    filename = f"{os.path.splitext(capture.original_filename)[0]}_packetscope.xml"

    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/captures/{capture_id}/exports/sqlite",
    summary="Export capture analysis as standalone SQLite database",
)
def export_sqlite(capture_id: str, db: Session = Depends(get_db)):
    capture = CaptureService.get_capture(db, capture_id)
    stats = db.query(CaptureStatistics).filter(CaptureStatistics.capture_id == capture_id).first()
    alerts = db.query(Alert).filter(Alert.capture_id == capture_id).all()
    packets = db.query(Packet).filter(Packet.capture_id == capture_id).order_by(Packet.packet_number.asc()).all()

    temp_dir = tempfile.mkdtemp()
    filename = f"{os.path.splitext(capture.original_filename)[0]}_analysis.sqlite"
    temp_sqlite_path = os.path.join(temp_dir, filename)

    export_capture_to_sqlite(capture, stats, alerts, packets, temp_sqlite_path)

    return FileResponse(
        path=temp_sqlite_path,
        media_type="application/x-sqlite3",
        filename=filename,
    )


@router.get(
    "/captures/{capture_id}/exports/csv",
    summary="Export packet metadata table as CSV",
)
def export_csv(capture_id: str, db: Session = Depends(get_db)):
    capture = CaptureService.get_capture(db, capture_id)
    packets = db.query(Packet).filter(Packet.capture_id == capture_id).order_by(Packet.packet_number.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "PacketNumber",
        "Timestamp",
        "RelativeTime",
        "SourceMAC",
        "DestMAC",
        "SourceIP",
        "DestIP",
        "IPVersion",
        "Protocol",
        "SourcePort",
        "DestPort",
        "Length",
        "TCPFlags",
        "DNSQuery",
        "HTTPMethod",
        "HTTPHost",
        "HTTPUri",
        "ICMPType",
        "Summary",
    ])

    for p in packets:
        writer.writerow([
            p.packet_number,
            p.timestamp.isoformat() if p.timestamp else "",
            p.relative_time,
            p.source_mac or "",
            p.dest_mac or "",
            p.source_ip or "",
            p.dest_ip or "",
            p.ip_version or "",
            p.transport_protocol or "",
            p.source_port or "",
            p.dest_port or "",
            p.packet_length,
            p.tcp_flags or "",
            p.dns_query_name or "",
            p.http_method or "",
            p.http_host or "",
            p.http_uri or "",
            p.icmp_type if p.icmp_type is not None else "",
            p.summary_info or "",
        ])

    csv_data = output.getvalue()
    filename = f"{os.path.splitext(capture.original_filename)[0]}_packets.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/captures/{capture_id}/exports/json",
    summary="Export capture summary as JSON",
)
def export_json(capture_id: str, db: Session = Depends(get_db)):
    capture = CaptureService.get_capture(db, capture_id)
    stats = db.query(CaptureStatistics).filter(CaptureStatistics.capture_id == capture_id).first()
    alerts = db.query(Alert).filter(Alert.capture_id == capture_id).all()

    stats_data = {}
    if stats:
        stats_data = {
            "total_packets": stats.total_packets,
            "duration_seconds": stats.duration_seconds,
            "total_bytes": stats.total_bytes,
            "avg_packet_size": stats.avg_packet_size,
            "packets_per_second": stats.packets_per_second,
            "unique_src_ips": stats.unique_src_ips,
            "unique_dst_ips": stats.unique_dst_ips,
            "protocol_distribution": json.loads(stats.protocol_distribution or "{}"),
            "port_distribution": json.loads(stats.port_distribution or "{}"),
            "top_talkers": json.loads(stats.top_talkers or "[]"),
            "top_conversations": json.loads(stats.top_conversations or "[]"),
        }

    return {
        "capture": {
            "id": capture.id,
            "filename": capture.original_filename,
            "file_size": capture.file_size,
            "sha256": capture.file_hash_sha256,
            "status": capture.status,
            "packet_count": capture.packet_count,
            "duration_seconds": capture.duration_seconds,
            "risk_score": capture.risk_score,
            "risk_level": capture.risk_level,
            "created_at": capture.created_at.isoformat() if capture.created_at else None,
            "processed_at": capture.processed_at.isoformat() if capture.processed_at else None,
        },
        "statistics": stats_data,
        "alerts_summary": {
            "total": len(alerts),
            "critical": sum(1 for a in alerts if a.severity == "CRITICAL"),
            "high": sum(1 for a in alerts if a.severity == "HIGH"),
            "medium": sum(1 for a in alerts if a.severity == "MEDIUM"),
            "low": sum(1 for a in alerts if a.severity == "LOW"),
        },
        "alerts": [
            {
                "rule_id": a.rule_id,
                "title": a.title,
                "severity": a.severity,
                "explanation": a.explanation,
                "evidence": json.loads(a.evidence) if a.evidence.startswith("{") else a.evidence,
                "source_ip": a.source_ip,
                "dest_ip": a.dest_ip,
                "event_count": a.event_count,
                "recommendation": a.recommendation,
                "disclaimer": a.disclaimer,
            }
            for a in alerts
        ],
        "disclaimer": (
            "PacketScope defensive export. Contains traffic metadata and heuristic security alerts only. "
            "No raw payload or credential content is stored."
        ),
    }
