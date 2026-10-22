"""Capture upload, querying, and inspection endpoints."""

import json
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.exceptions import CaptureNotFoundError
from backend.app.models.alert import Alert
from backend.app.models.capture import Capture
from backend.app.models.packet import Packet
from backend.app.models.statistics import CaptureStatistics
from backend.app.schemas.alert import AlertListResponse, AlertResponse
from backend.app.schemas.capture import CaptureListResponse, CaptureResponse, CaptureStatusResponse
from backend.app.schemas.packet import PacketListResponse, PacketResponse
from backend.app.schemas.statistics import StatisticsResponse
from backend.app.services.capture_service import CaptureService

router = APIRouter()


@router.post(
    "/captures",
    response_model=CaptureResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and analyze network capture",
)
async def upload_capture(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    analyze_immediately: bool = Query(True, description="Execute analysis synchronously in request"),
    db: Session = Depends(get_db),
):
    """Upload a .pcap or .pcapng file, validate integrity, and process packet metadata."""
    capture = await CaptureService.save_uploaded_capture(db, file)

    if analyze_immediately:
        CaptureService.process_capture_file(db, capture.id)
    else:
        background_tasks.add_task(CaptureService.process_capture_file, db, capture.id)

    db.refresh(capture)
    return capture


@router.post(
    "/captures/demo/{demo_id}",
    response_model=CaptureResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Load and analyze a preset presentation sample PCAP",
)
def load_demo_capture(
    demo_id: str,
    db: Session = Depends(get_db),
):
    """Load pre-generated presentation sample captures (port_scan, web_traffic, multi_threat)."""
    import os
    import shutil
    import uuid
    import hashlib
    from backend.app.core.config import settings
    from backend.app.core.exceptions import InvalidCaptureFileError

    demo_map = {
        "port_scan": ("demo_port_scan.pcap", "Port Scan & Reconnaissance Demo"),
        "web_traffic": ("demo_web_cleartext.pcap", "Web Application Traffic Demo"),
        "multi_threat": ("demo_multi_threat.pcap", "Multi-Threat Incident Demo"),
    }

    if demo_id not in demo_map:
        raise InvalidCaptureFileError(f"Unknown demo ID '{demo_id}'. Choose from: {list(demo_map.keys())}")

    filename, desc = demo_map[demo_id]
    sample_path = os.path.join(settings.BASE_DIR.parent, "sample_data", filename)

    if not os.path.exists(sample_path):
        from scripts.generate_presentation_pcaps import generate_demo_1_port_scan, generate_demo_2_web_traffic, generate_demo_3_multi_threat
        if demo_id == "port_scan":
            sample_path = generate_demo_1_port_scan()
        elif demo_id == "web_traffic":
            sample_path = generate_demo_2_web_traffic()
        else:
            sample_path = generate_demo_3_multi_threat()

    with open(sample_path, "rb") as f:
        content = f.read()

    cap_id = str(uuid.uuid4())
    stored_name = f"{cap_id}.pcap"
    dest_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    with open(dest_path, "wb") as f_out:
        f_out.write(content)

    sha256 = hashlib.sha256(content).hexdigest()
    capture = Capture(
        id=cap_id,
        filename=stored_name,
        original_filename=filename,
        file_path=dest_path,
        file_size=len(content),
        file_hash_sha256=sha256,
        status="pending",
    )
    db.add(capture)
    db.commit()

    CaptureService.process_capture_file(db, cap_id)
    db.refresh(capture)
    return capture


@router.get(
    "/captures",
    response_model=CaptureListResponse,
    summary="List analyzed captures with pagination",
)
def list_captures(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    total, items = CaptureService.list_captures(db, skip=skip, limit=limit)
    return {"total": total, "items": items}


@router.get(
    "/captures/{capture_id}",
    response_model=CaptureResponse,
    summary="Get capture details by ID",
)
def get_capture(capture_id: str, db: Session = Depends(get_db)):
    return CaptureService.get_capture(db, capture_id)


@router.get(
    "/captures/{capture_id}/status",
    response_model=CaptureStatusResponse,
    summary="Poll capture processing status",
)
def get_capture_status(capture_id: str, db: Session = Depends(get_db)):
    capture = CaptureService.get_capture(db, capture_id)
    return capture


@router.get(
    "/captures/{capture_id}/packets",
    response_model=PacketListResponse,
    summary="Search and paginate packet metadata with filters",
)
def get_capture_packets(
    capture_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    protocol: Optional[str] = Query(None, description="Filter by transport protocol (e.g. TCP, UDP, ICMP, DNS, HTTP)"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    dest_ip: Optional[str] = Query(None, description="Filter by destination IP"),
    source_port: Optional[int] = Query(None, ge=1, le=65535, description="Filter by source port"),
    dest_port: Optional[int] = Query(None, ge=1, le=65535, description="Filter by destination port"),
    search: Optional[str] = Query(None, description="Free-text search across IPs, MACs, queries, and summaries"),
    time_start: Optional[float] = Query(None, ge=0.0, description="Relative start time"),
    time_end: Optional[float] = Query(None, ge=0.0, description="Relative end time"),
    db: Session = Depends(get_db),
):
    # Verify capture exists
    CaptureService.get_capture(db, capture_id)

    query = db.query(Packet).filter(Packet.capture_id == capture_id)

    if protocol:
        query = query.filter(Packet.transport_protocol.ilike(f"%{protocol.strip()}%"))

    if source_ip:
        query = query.filter(Packet.source_ip == source_ip.strip())

    if dest_ip:
        query = query.filter(Packet.dest_ip == dest_ip.strip())

    if source_port:
        query = query.filter(Packet.source_port == source_port)

    if dest_port:
        query = query.filter(Packet.dest_port == dest_port)

    if time_start is not None:
        query = query.filter(Packet.relative_time >= time_start)

    if time_end is not None:
        query = query.filter(Packet.relative_time <= time_end)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Packet.source_ip.ilike(s),
                Packet.dest_ip.ilike(s),
                Packet.source_mac.ilike(s),
                Packet.dest_mac.ilike(s),
                Packet.dns_query_name.ilike(s),
                Packet.http_host.ilike(s),
                Packet.summary_info.ilike(s),
            )
        )

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Packet.packet_number.asc()).offset(offset).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "items": items,
    }


@router.get(
    "/captures/{capture_id}/statistics",
    response_model=StatisticsResponse,
    summary="Get aggregated statistics for capture",
)
def get_capture_statistics(capture_id: str, db: Session = Depends(get_db)):
    CaptureService.get_capture(db, capture_id)
    stats = db.query(CaptureStatistics).filter(CaptureStatistics.capture_id == capture_id).first()
    if not stats:
        raise CaptureNotFoundError(f"Statistics for capture '{capture_id}' not found.")

    return {
        "id": stats.id,
        "capture_id": stats.capture_id,
        "total_packets": stats.total_packets,
        "duration_seconds": stats.duration_seconds,
        "start_time": stats.start_time,
        "end_time": stats.end_time,
        "total_bytes": stats.total_bytes,
        "avg_packet_size": stats.avg_packet_size,
        "packets_per_second": stats.packets_per_second,
        "unique_src_ips": stats.unique_src_ips,
        "unique_dst_ips": stats.unique_dst_ips,
        "protocol_distribution": json.loads(stats.protocol_distribution or "{}"),
        "port_distribution": json.loads(stats.port_distribution or "{}"),
        "top_talkers": json.loads(stats.top_talkers or "[]"),
        "top_conversations": json.loads(stats.top_conversations or "[]"),
        "time_series": json.loads(stats.time_series or "[]"),
    }


@router.get(
    "/captures/{capture_id}/alerts",
    response_model=AlertListResponse,
    summary="Get rule-based security alerts for capture",
)
def get_capture_alerts(
    capture_id: str,
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    db: Session = Depends(get_db),
):
    CaptureService.get_capture(db, capture_id)
    query = db.query(Alert).filter(Alert.capture_id == capture_id)

    if severity:
        query = query.filter(Alert.severity == severity.upper().strip())

    alerts = query.order_by(Alert.event_count.desc()).all()

    crit = sum(1 for a in alerts if a.severity == "CRITICAL")
    high = sum(1 for a in alerts if a.severity == "HIGH")
    med = sum(1 for a in alerts if a.severity == "MEDIUM")
    low = sum(1 for a in alerts if a.severity == "LOW")

    return {
        "total": len(alerts),
        "critical_count": crit,
        "high_count": high,
        "medium_count": med,
        "low_count": low,
        "items": alerts,
    }
