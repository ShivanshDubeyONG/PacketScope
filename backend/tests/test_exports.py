"""Tests for all export formats: XML, SQLite, CSV, JSON."""

import sqlite3
import tempfile
import xml.etree.ElementTree as ET
from fastapi import status


def _upload_and_get_id(client, sample_pcap_path) -> str:
    with open(sample_pcap_path, "rb") as f:
        res = client.post(
            "/api/v1/captures?analyze_immediately=true",
            files={"file": ("synthetic_sample.pcap", f, "application/vnd.tcpdump.pcap")},
        )
    assert res.status_code == status.HTTP_201_CREATED
    return res.json()["id"]


def test_export_xml_validity(client, sample_pcap_path):
    capture_id = _upload_and_get_id(client, sample_pcap_path)
    res = client.get(f"/api/v1/captures/{capture_id}/exports/xml")
    assert res.status_code == status.HTTP_200_OK
    assert "xml" in res.headers.get("content-type", "")

    # Parse XML content to confirm valid structure
    xml_tree = ET.fromstring(res.content)
    assert xml_tree.tag == "PacketScopeAnalysis"

    # Verify expected child nodes
    assert xml_tree.find("Capture") is not None
    assert xml_tree.find("Statistics") is not None
    assert xml_tree.find("Alerts") is not None
    assert xml_tree.find("Packets") is not None

    capture_id_elem = xml_tree.find("Capture/Id")
    assert capture_id_elem is not None
    assert capture_id_elem.text == capture_id


def test_export_sqlite_validity(client, sample_pcap_path):
    capture_id = _upload_and_get_id(client, sample_pcap_path)
    res = client.get(f"/api/v1/captures/{capture_id}/exports/sqlite")
    assert res.status_code == status.HTTP_200_OK

    # Save to temp file and open with sqlite3
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as tmp:
        tmp.write(res.content)
        tmp_path = tmp.name

    conn = sqlite3.connect(tmp_path)
    cur = conn.cursor()

    # Verify tables exist
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = {row[0] for row in cur.fetchall()}
    assert "capture_metadata" in tables
    assert "packets" in tables
    assert "alerts" in tables
    assert "statistics" in tables

    # Verify content in tables
    cur.execute("SELECT count(*) FROM packets")
    pkt_count = cur.fetchone()[0]
    assert pkt_count > 0

    cur.execute("SELECT count(*) FROM alerts")
    alert_count = cur.fetchone()[0]
    assert alert_count > 0

    cur.execute("SELECT id, filename FROM capture_metadata")
    row = cur.fetchone()
    assert row[0] == capture_id

    conn.close()


def test_export_csv_validity(client, sample_pcap_path):
    capture_id = _upload_and_get_id(client, sample_pcap_path)
    res = client.get(f"/api/v1/captures/{capture_id}/exports/csv")
    assert res.status_code == status.HTTP_200_OK
    assert "text/csv" in res.headers.get("content-type", "")

    lines = res.text.strip().split("\r\n") if "\r\n" in res.text else res.text.strip().split("\n")
    assert len(lines) > 1
    # Check header
    header = lines[0]
    assert "PacketNumber" in header
    assert "SourceIP" in header
    assert "DestIP" in header
    assert "Protocol" in header


def test_export_json_validity(client, sample_pcap_path):
    capture_id = _upload_and_get_id(client, sample_pcap_path)
    res = client.get(f"/api/v1/captures/{capture_id}/exports/json")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "capture" in data
    assert "statistics" in data
    assert "alerts_summary" in data
    assert "alerts" in data
    assert data["capture"]["id"] == capture_id
    assert data["alerts_summary"]["total"] > 0
