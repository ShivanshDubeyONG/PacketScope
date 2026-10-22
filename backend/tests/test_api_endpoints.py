"""Integration tests for all REST API endpoints."""

from fastapi import status


def test_api_capture_lifecycle(client, sample_pcap_path):
    # 1. Upload capture
    with open(sample_pcap_path, "rb") as f:
        res = client.post(
            "/api/v1/captures?analyze_immediately=true",
            files={"file": ("synthetic_sample.pcap", f, "application/vnd.tcpdump.pcap")},
        )
    assert res.status_code == status.HTTP_201_CREATED
    cap_data = res.json()
    capture_id = cap_data["id"]
    assert cap_data["status"] == "completed"
    assert cap_data["packet_count"] > 0
    assert cap_data["risk_score"] > 0

    # 2. Get capture by ID
    res_get = client.get(f"/api/v1/captures/{capture_id}")
    assert res_get.status_code == status.HTTP_200_OK
    assert res_get.json()["id"] == capture_id

    # 3. Check status
    res_status = client.get(f"/api/v1/captures/{capture_id}/status")
    assert res_status.status_code == status.HTTP_200_OK
    assert res_status.json()["status"] == "completed"

    # 4. List captures
    res_list = client.get("/api/v1/captures?skip=0&limit=10")
    assert res_list.status_code == status.HTTP_200_OK
    list_data = res_list.json()
    assert list_data["total"] >= 1
    assert any(c["id"] == capture_id for c in list_data["items"])

    # 5. Get statistics
    res_stats = client.get(f"/api/v1/captures/{capture_id}/statistics")
    assert res_stats.status_code == status.HTTP_200_OK
    stats_data = res_stats.json()
    assert stats_data["total_packets"] > 0
    assert len(stats_data["top_talkers"]) > 0

    # 6. Get alerts
    res_alerts = client.get(f"/api/v1/captures/{capture_id}/alerts")
    assert res_alerts.status_code == status.HTTP_200_OK
    alerts_data = res_alerts.json()
    assert alerts_data["total"] > 0
    assert len(alerts_data["items"]) > 0

    # 7. Get alerts with severity filter
    res_high = client.get(f"/api/v1/captures/{capture_id}/alerts?severity=HIGH")
    assert res_high.status_code == status.HTTP_200_OK
    high_data = res_high.json()
    assert all(a["severity"] == "HIGH" for a in high_data["items"])

    # 8. Get packets with pagination and protocol filter
    res_pkts = client.get(f"/api/v1/captures/{capture_id}/packets?page=1&page_size=20&protocol=DNS")
    assert res_pkts.status_code == status.HTTP_200_OK
    pkts_data = res_pkts.json()
    assert pkts_data["total"] >= 1
    assert all(p["transport_protocol"] == "DNS" for p in pkts_data["items"])

    # 9. Free-text search filter
    res_search = client.get(f"/api/v1/captures/{capture_id}/packets?search=192.168.1.100")
    assert res_search.status_code == status.HTTP_200_OK
    assert res_search.json()["total"] > 0

    # 10. Nonexistent capture ID returns 404
    res_404 = client.get("/api/v1/captures/00000000-0000-0000-0000-000000000000")
    assert res_404.status_code == status.HTTP_404_NOT_FOUND
    assert res_404.json()["error"]["code"] == "CAPTURE_NOT_FOUND"
