"""PCAP to XML exporter service for PacketScope."""

import xml.etree.ElementTree as ET
from xml.dom import minidom
from typing import Any, Dict, List


def generate_capture_xml(
    capture: Any,
    statistics: Any,
    alerts: List[Any],
    packets: List[Any],
) -> str:
    """Generate well-formed, structured XML containing capture metadata, stats, alerts, and packet list."""
    root = ET.Element("PacketScopeAnalysis", {
        "version": "1.0",
        "system": "PacketScope Defensive Traffic Platform",
    })

    # Capture metadata
    cap_elem = ET.SubElement(root, "Capture")
    ET.SubElement(cap_elem, "Id").text = str(capture.id)
    ET.SubElement(cap_elem, "Filename").text = str(capture.original_filename)
    ET.SubElement(cap_elem, "FileSizeBytes").text = str(capture.file_size)
    ET.SubElement(cap_elem, "Sha256").text = str(capture.file_hash_sha256)
    ET.SubElement(cap_elem, "Status").text = str(capture.status)
    ET.SubElement(cap_elem, "PacketCount").text = str(capture.packet_count)
    ET.SubElement(cap_elem, "DurationSeconds").text = str(capture.duration_seconds)
    ET.SubElement(cap_elem, "RiskScore").text = str(capture.risk_score)
    ET.SubElement(cap_elem, "RiskLevel").text = str(capture.risk_level)
    ET.SubElement(cap_elem, "CreatedAt").text = str(capture.created_at)

    # Statistics
    if statistics:
        stats_elem = ET.SubElement(root, "Statistics")
        ET.SubElement(stats_elem, "TotalPackets").text = str(statistics.total_packets)
        ET.SubElement(stats_elem, "TotalBytes").text = str(statistics.total_bytes)
        ET.SubElement(stats_elem, "AveragePacketSize").text = str(statistics.avg_packet_size)
        ET.SubElement(stats_elem, "PacketsPerSecond").text = str(statistics.packets_per_second)
        ET.SubElement(stats_elem, "UniqueSourceIps").text = str(statistics.unique_src_ips)
        ET.SubElement(stats_elem, "UniqueDestinationIps").text = str(statistics.unique_dst_ips)
        ET.SubElement(stats_elem, "ProtocolDistribution").text = str(statistics.protocol_distribution)
        ET.SubElement(stats_elem, "PortDistribution").text = str(statistics.port_distribution)

    # Alerts
    alerts_elem = ET.SubElement(root, "Alerts", {"count": str(len(alerts))})
    for a in alerts:
        a_elem = ET.SubElement(alerts_elem, "Alert")
        ET.SubElement(a_elem, "RuleId").text = str(a.rule_id)
        ET.SubElement(a_elem, "Title").text = str(a.title)
        ET.SubElement(a_elem, "Severity").text = str(a.severity)
        ET.SubElement(a_elem, "Explanation").text = str(a.explanation)
        ET.SubElement(a_elem, "Evidence").text = str(a.evidence)
        ET.SubElement(a_elem, "SourceIp").text = str(a.source_ip or "")
        ET.SubElement(a_elem, "DestIp").text = str(a.dest_ip or "")
        ET.SubElement(a_elem, "EventCount").text = str(a.event_count)
        ET.SubElement(a_elem, "Recommendation").text = str(a.recommendation)
        ET.SubElement(a_elem, "Disclaimer").text = str(a.disclaimer)

    # Packets
    packets_elem = ET.SubElement(root, "Packets", {"count": str(len(packets))})
    for p in packets:
        p_elem = ET.SubElement(packets_elem, "Packet")
        ET.SubElement(p_elem, "Number").text = str(p.packet_number)
        ET.SubElement(p_elem, "Timestamp").text = str(p.timestamp)
        ET.SubElement(p_elem, "RelativeTime").text = str(p.relative_time)
        ET.SubElement(p_elem, "SourceIp").text = str(p.source_ip or "")
        ET.SubElement(p_elem, "DestIp").text = str(p.dest_ip or "")
        ET.SubElement(p_elem, "Protocol").text = str(p.transport_protocol or "")
        ET.SubElement(p_elem, "SourcePort").text = str(p.source_port or "")
        ET.SubElement(p_elem, "DestPort").text = str(p.dest_port or "")
        ET.SubElement(p_elem, "Length").text = str(p.packet_length)
        ET.SubElement(p_elem, "Flags").text = str(p.tcp_flags or "")
        if p.dns_query_name:
            ET.SubElement(p_elem, "DnsQuery").text = str(p.dns_query_name)
        if p.http_method:
            ET.SubElement(p_elem, "HttpMethod").text = str(p.http_method)
            ET.SubElement(p_elem, "HttpHost").text = str(p.http_host or "")
            ET.SubElement(p_elem, "HttpUri").text = str(p.http_uri or "")
        ET.SubElement(p_elem, "Summary").text = str(p.summary_info or "")

    rough_string = ET.tostring(root, "utf-8")
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")
