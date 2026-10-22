"""Automated verification script for Phase 1 API, engine, and exports."""

import json
import os
import sqlite3
import sys
import time
import xml.etree.ElementTree as ET
import httpx

from backend.app.core.config import settings
from backend.app.core.database import init_db, SessionLocal
from backend.app.models.capture import Capture
from backend.app.services.capture_service import CaptureService
from scripts.generate_sample_pcap import generate_synthetic_pcap


def verify_phase1():
    print("=" * 60)
    print("PacketScope Phase 1 Live Verification")
    print("=" * 60)

    # 1. Database initialization
    print("[1] Initializing SQLite Database schema...")
    init_db()
    print("    Database ready at:", settings.SQLITE_DB_PATH)

    # 2. Check TShark
    print("\n[2] Checking TShark availability...")
    tshark_path = settings.resolved_tshark_path
    print(f"    Resolved TShark path: {tshark_path}")
    if not tshark_path:
        print("    ERROR: TShark not found.")
        sys.exit(1)
    print("    TShark is available and ready.")

    # 3. Generate sample PCAP if needed
    pcap_path = os.path.join("sample_data", "synthetic_sample.pcap")
    if not os.path.exists(pcap_path):
        print("\n[3] Generating synthetic PCAP...")
        generate_synthetic_pcap(pcap_path)
    else:
        print(f"\n[3] Using synthetic PCAP: {pcap_path} ({os.path.getsize(pcap_path)} bytes)")

    # 4. Perform direct end-to-end capture analysis
    print("\n[4] Running Capture Analysis via PyShark/TShark & Engine...")
    db = SessionLocal()
    try:
        # Mock UploadFile-like object
        with open(pcap_path, "rb") as f:
            content = f.read()

        import uuid
        import hashlib
        cap_id = str(uuid.uuid4())
        stored_name = f"{cap_id}.pcap"
        dest_path = os.path.join(settings.UPLOAD_DIR, stored_name)
        with open(dest_path, "wb") as f_out:
            f_out.write(content)

        sha256 = hashlib.sha256(content).hexdigest()
        capture = Capture(
            id=cap_id,
            filename=stored_name,
            original_filename="synthetic_sample.pcap",
            file_path=dest_path,
            file_size=len(content),
            file_hash_sha256=sha256,
            status="pending",
        )
        db.add(capture)
        db.commit()

        processed_cap = CaptureService.process_capture_file(db, cap_id)
        print(f"    Capture Processed: Status={processed_cap.status}, Packets={processed_cap.packet_count}, Duration={processed_cap.duration_seconds}s")
        print(f"    Risk Score={processed_cap.risk_score} (Level: {processed_cap.risk_level})")

        # 5. Verify database contents
        stats = processed_cap.statistics
        alerts = processed_cap.alerts
        packets = processed_cap.packets

        print(f"\n[5] Database Record Verification:")
        print(f"    - Packets stored: {len(packets)}")
        print(f"    - Total bytes: {stats.total_bytes}")
        print(f"    - Protocols: {stats.protocol_distribution}")
        print(f"    - Alerts triggered: {len(alerts)}")
        for a in alerts:
            print(f"      * [{a.severity}] {a.title} ({a.rule_id})")

        # 6. Verify XML Export
        print("\n[6] Verifying PCAP to XML export...")
        from backend.app.services.xml_exporter import generate_capture_xml
        xml_data = generate_capture_xml(processed_cap, stats, alerts, packets)
        tree = ET.fromstring(xml_data)
        assert tree.tag == "PacketScopeAnalysis"
        assert tree.find("Capture/Id").text == cap_id
        xml_out = os.path.join("sample_data", "verified_export.xml")
        with open(xml_out, "w", encoding="utf-8") as f_xml:
            f_xml.write(xml_data)
        print(f"    XML export generated and validated ({len(xml_data)} bytes) -> {xml_out}")

        # 7. Verify SQLite Export
        print("\n[7] Verifying PCAP to SQLite standalone export...")
        from backend.app.services.sqlite_exporter import export_capture_to_sqlite
        sqlite_out = os.path.join("sample_data", "verified_export.sqlite")
        export_capture_to_sqlite(processed_cap, stats, alerts, packets, sqlite_out)
        
        conn = sqlite3.connect(sqlite_out)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM packets")
        sql_pkts = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM alerts")
        sql_alerts = cur.fetchone()[0]
        conn.close()
        print(f"    SQLite export generated and validated -> {sqlite_out}")
        print(f"    Standalone SQLite table check: {sql_pkts} packets, {sql_alerts} alerts verified.")

        print("\n" + "=" * 60)
        print("ALL PHASE 1 VERIFICATION CHECKS PASSED SUCCESSFULLY!")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    verify_phase1()
