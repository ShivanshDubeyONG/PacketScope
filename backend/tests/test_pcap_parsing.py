"""Tests for PCAP parsing engine and field extraction."""

from backend.app.services.pcap_parser import parse_pcap_file, validate_capture_file


def test_validate_capture_file(sample_pcap_path):
    # Should not raise exception for valid synthetic PCAP
    validate_capture_file(sample_pcap_path)


def test_parse_pcap_packets_extraction(sample_pcap_path):
    packets = parse_pcap_file(sample_pcap_path)
    assert len(packets) > 0

    first = packets[0]
    assert "packet_number" in first
    assert "timestamp" in first
    assert "relative_time" in first
    assert "transport_protocol" in first
    assert "packet_length" in first

    # Check that DNS packet was extracted
    dns_packets = [p for p in packets if p["transport_protocol"] == "DNS"]
    assert len(dns_packets) >= 1
    assert any("packetscope.local" in (p["dns_query_name"] or "") for p in dns_packets)

    # Check that HTTP packet was extracted
    http_packets = [p for p in packets if p["transport_protocol"] == "HTTP"]
    assert len(http_packets) >= 1
    assert any(p["http_method"] == "GET" for p in http_packets)

    # Check that ICMP packets were extracted
    icmp_packets = [p for p in packets if p["transport_protocol"] == "ICMP"]
    assert len(icmp_packets) >= 1
    assert any(p["icmp_type"] == 8 for p in icmp_packets)

    # Check that TCP flags were extracted
    tcp_packets = [p for p in packets if p["transport_protocol"] == "TCP"]
    assert len(tcp_packets) >= 1
    assert any(p["tcp_flags"] is not None for p in tcp_packets)
