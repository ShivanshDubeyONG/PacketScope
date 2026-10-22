"""Tests for health check endpoint."""

from fastapi import status


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "status" in data
    assert data["service"] == "PacketScope Network Traffic Analysis Platform"
    assert data["database"] == "connected"
    assert "tshark" in data
    assert "available" in data["tshark"]


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["service"] == "PacketScope API"
    assert "health" in data
