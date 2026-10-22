"""Tests for upload validation, security, and integrity checks."""

import io
from fastapi import status


def test_upload_valid_pcap(client, sample_pcap_path):
    with open(sample_pcap_path, "rb") as f:
        response = client.post(
            "/api/v1/captures?analyze_immediately=true",
            files={"file": ("synthetic_sample.pcap", f, "application/vnd.tcpdump.pcap")},
        )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["status"] in ["completed", "processing"]
    assert data["original_filename"] == "synthetic_sample.pcap"
    assert data["packet_count"] > 0
    assert len(data["file_hash_sha256"]) == 64


def test_reject_unsupported_extension(client):
    fake_file = io.BytesIO(b"some text data")
    response = client.post(
        "/api/v1/captures",
        files={"file": ("malicious.exe", fake_file, "application/octet-stream")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["error"]["code"] == "INVALID_CAPTURE_FILE"
    assert "Unsupported file format" in data["error"]["message"]


def test_reject_empty_file(client):
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/v1/captures",
        files={"file": ("empty.pcap", empty_file, "application/octet-stream")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["error"]["code"] == "INVALID_CAPTURE_FILE"
    assert "empty" in data["error"]["message"].lower()


def test_reject_invalid_magic_bytes(client):
    # .pcap extension but invalid binary header
    bad_bytes = io.BytesIO(b"RANDOM_NON_PCAP_GARBAGE_BYTES_1234567890")
    response = client.post(
        "/api/v1/captures",
        files={"file": ("corrupt.pcap", bad_bytes, "application/octet-stream")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["error"]["code"] == "INVALID_CAPTURE_FILE"
    assert "magic bytes" in data["error"]["message"].lower()


def test_sanitize_filename_prevents_traversal(client, sample_pcap_path):
    with open(sample_pcap_path, "rb") as f:
        response = client.post(
            "/api/v1/captures?analyze_immediately=false",
            files={"file": ("../../../../etc/passwd.pcap", f, "application/octet-stream")},
        )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    # Stored filename must not contain traversal dots/slashes
    assert ".." not in data["filename"]
    assert "/" not in data["filename"]
    assert "\\" not in data["filename"]
