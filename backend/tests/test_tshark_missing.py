"""Tests for missing TShark detection and graceful error responses."""

from unittest.mock import patch
import pytest
from fastapi import status
from backend.app.core.exceptions import TSharkNotFoundError
from backend.app.services.pcap_parser import parse_pcap_file


def test_tshark_not_found_raises_exception(sample_pcap_path):
    with patch("backend.app.core.config.Settings.resolved_tshark_path", new=None):
        with pytest.raises(TSharkNotFoundError) as exc_info:
            parse_pcap_file(sample_pcap_path)

        assert exc_info.value.code == "TSHARK_NOT_FOUND"
        assert "TShark executable not found" in exc_info.value.message


def test_upload_when_tshark_missing_returns_503(client, sample_pcap_path):
    with patch("backend.app.core.config.Settings.resolved_tshark_path", new=None):
        with open(sample_pcap_path, "rb") as f:
            res = client.post(
                "/api/v1/captures?analyze_immediately=true",
                files={"file": ("synthetic_sample.pcap", f, "application/vnd.tcpdump.pcap")},
            )

        assert res.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = res.json()
        assert data["error"]["code"] == "TSHARK_NOT_FOUND"
        assert "TShark" in data["error"]["message"]
