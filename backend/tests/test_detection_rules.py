"""Tests for transparent detection engine rules and risk scoring."""

import json
from datetime import datetime, timezone
from backend.app.services.detection_engine import calculate_risk_score, evaluate_rules
from backend.app.services.pcap_parser import parse_pcap_file


def test_evaluate_rules_on_synthetic_sample(sample_pcap_path):
    packets = parse_pcap_file(sample_pcap_path)
    alerts = evaluate_rules(packets)
    assert len(alerts) > 0

    rule_ids = {a["rule_id"] for a in alerts}

    # Verify each expected rule from the synthetic traffic generator was triggered:
    assert "RULE_PORT_SCAN" in rule_ids
    assert "RULE_REPEATED_TCP_SYN" in rule_ids
    assert "RULE_SUSPICIOUS_PORT_ACTIVITY" in rule_ids
    assert "RULE_ICMP_FLOOD" in rule_ids
    assert "RULE_LARGE_DNS_QUERY" in rule_ids
    assert "RULE_UNENCRYPTED_PROTOCOL" in rule_ids
    assert "RULE_TRAFFIC_CONCENTRATION" in rule_ids

    # Verify alert properties and defensive disclaimer
    for alert in alerts:
        assert alert["title"]
        assert alert["severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert alert["explanation"]
        assert alert["recommendation"]
        assert "evidence" in alert
        # Evidence must be valid JSON
        ev_data = json.loads(alert["evidence"])
        assert isinstance(ev_data, dict)
        # Disclaimer must explicitly state heuristic nature
        assert "not confirmed" in alert["disclaimer"].lower() or "suspicious" in alert["disclaimer"].lower()


def test_rule_1_port_scan_isolated():
    # Craft 20 distinct destination port contacts within 5 seconds
    now = datetime.now(timezone.utc)
    packets = []
    for port in range(100, 120):
        packets.append({
            "source_ip": "192.168.1.50",
            "dest_ip": "10.0.0.1",
            "dest_port": port,
            "transport_protocol": "TCP",
            "tcp_flags": "S",
            "relative_time": (port - 100) * 0.1,
            "timestamp": now,
        })
    alerts = evaluate_rules(packets)
    scan_alerts = [a for a in alerts if a["rule_id"] == "RULE_PORT_SCAN"]
    assert len(scan_alerts) == 1
    assert scan_alerts[0]["severity"] == "HIGH"
    assert scan_alerts[0]["source_ip"] == "192.168.1.50"


def test_rule_6_large_dns_query_isolated():
    now = datetime.now(timezone.utc)
    packets = [
        {
            "source_ip": "192.168.1.10",
            "dest_ip": "8.8.8.8",
            "source_port": 53000,
            "dest_port": 53,
            "transport_protocol": "DNS",
            "dns_query_name": "a" * 75 + ".evil.local",
            "relative_time": 0.1,
            "timestamp": now,
        }
    ]
    alerts = evaluate_rules(packets)
    dns_alerts = [a for a in alerts if a["rule_id"] == "RULE_LARGE_DNS_QUERY"]
    assert len(dns_alerts) == 1
    assert dns_alerts[0]["severity"] == "HIGH"


def test_risk_score_calculation():
    # Empty
    score, level = calculate_risk_score([])
    assert score == 0
    assert level == "NONE"

    # Single low alert
    score, level = calculate_risk_score([{"severity": "LOW"}])
    assert score == 5
    assert level == "LOW"

    # Multiple high & critical alerts
    score, level = calculate_risk_score([
        {"severity": "CRITICAL"},
        {"severity": "HIGH"},
        {"severity": "HIGH"},
        {"severity": "MEDIUM"},
    ])
    # 35 + 20 + 20 + 10 = 85
    assert score == 85
    assert level == "CRITICAL"
