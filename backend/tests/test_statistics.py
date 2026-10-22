"""Tests for capture statistics calculation."""

from backend.app.services.pcap_parser import parse_pcap_file
from backend.app.services.stats_calculator import calculate_capture_statistics


def test_statistics_calculation_on_sample(sample_pcap_path):
    packets = parse_pcap_file(sample_pcap_path)
    stats = calculate_capture_statistics(packets)

    assert stats["total_packets"] == len(packets)
    assert stats["total_bytes"] > 0
    assert stats["avg_packet_size"] > 0
    assert stats["duration_seconds"] >= 0
    assert stats["packets_per_second"] > 0
    assert stats["unique_src_ips"] > 0
    assert stats["unique_dst_ips"] > 0

    # Protocol distribution
    proto_dist = stats["protocol_distribution"]
    assert isinstance(proto_dist, dict)
    assert "TCP" in proto_dist
    assert "UDP" in proto_dist
    assert "ICMP" in proto_dist

    # Port distribution
    port_dist = stats["port_distribution"]
    assert isinstance(port_dist, dict)
    assert len(port_dist) > 0

    # Top talkers
    top_talkers = stats["top_talkers"]
    assert isinstance(top_talkers, list)
    assert len(top_talkers) > 0
    assert "ip" in top_talkers[0]
    assert "packet_count" in top_talkers[0]
    assert "byte_count" in top_talkers[0]

    # Top conversations
    conversations = stats["top_conversations"]
    assert isinstance(conversations, list)
    assert len(conversations) > 0
    assert "source_ip" in conversations[0]
    assert "dest_ip" in conversations[0]
    assert "protocol" in conversations[0]

    # Time series
    time_series = stats["time_series"]
    assert isinstance(time_series, list)
    assert len(time_series) > 0
    assert "timestamp" in time_series[0]
    assert "packet_count" in time_series[0]


def test_statistics_empty_packet_list():
    stats = calculate_capture_statistics([])
    assert stats["total_packets"] == 0
    assert stats["total_bytes"] == 0
    assert stats["protocol_distribution"] == {}
    assert stats["top_talkers"] == []
