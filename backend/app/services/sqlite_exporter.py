"""PCAP to SQLite standalone database exporter service for PacketScope."""

import sqlite3
import tempfile
import os
from typing import Any, List


def export_capture_to_sqlite(
    capture: Any,
    statistics: Any,
    alerts: List[Any],
    packets: List[Any],
    output_path: str,
) -> str:
    """Create a standalone SQLite database containing all metadata, packets, stats, and alerts."""
    if os.path.exists(output_path):
        os.remove(output_path)

    conn = sqlite3.connect(output_path)
    cur = conn.cursor()

    # Create tables
    cur.execute("""
    CREATE TABLE capture_metadata (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        sha256 TEXT NOT NULL,
        status TEXT NOT NULL,
        packet_count INTEGER NOT NULL,
        duration_seconds REAL NOT NULL,
        risk_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE packets (
        packet_number INTEGER PRIMARY KEY,
        timestamp TEXT NOT NULL,
        relative_time REAL NOT NULL,
        source_mac TEXT,
        dest_mac TEXT,
        source_ip TEXT,
        dest_ip TEXT,
        ip_version INTEGER,
        transport_protocol TEXT,
        source_port INTEGER,
        dest_port INTEGER,
        packet_length INTEGER NOT NULL,
        tcp_flags TEXT,
        dns_query_name TEXT,
        dns_query_type TEXT,
        http_method TEXT,
        http_host TEXT,
        http_uri TEXT,
        icmp_type INTEGER,
        summary_info TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE alerts (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        title TEXT NOT NULL,
        severity TEXT NOT NULL,
        explanation TEXT NOT NULL,
        evidence TEXT NOT NULL,
        source_ip TEXT,
        dest_ip TEXT,
        event_count INTEGER NOT NULL,
        recommendation TEXT NOT NULL,
        disclaimer TEXT NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE statistics (
        total_packets INTEGER NOT NULL,
        total_bytes INTEGER NOT NULL,
        duration_seconds REAL NOT NULL,
        packets_per_second REAL NOT NULL,
        average_packet_size REAL NOT NULL,
        unique_src_ips INTEGER NOT NULL,
        unique_dst_ips INTEGER NOT NULL,
        protocol_distribution TEXT NOT NULL,
        port_distribution TEXT NOT NULL
    );
    """)

    # Insert Capture
    cur.execute(
        """
        INSERT INTO capture_metadata VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(capture.id),
            str(capture.original_filename),
            int(capture.file_size),
            str(capture.file_hash_sha256),
            str(capture.status),
            int(capture.packet_count),
            float(capture.duration_seconds),
            int(capture.risk_score),
            str(capture.risk_level),
            str(capture.created_at),
        ),
    )

    # Insert Statistics
    if statistics:
        cur.execute(
            """
            INSERT INTO statistics VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(statistics.total_packets),
                int(statistics.total_bytes),
                float(statistics.duration_seconds),
                float(statistics.packets_per_second),
                float(statistics.avg_packet_size),
                int(statistics.unique_src_ips),
                int(statistics.unique_dst_ips),
                str(statistics.protocol_distribution),
                str(statistics.port_distribution),
            ),
        )

    # Insert Alerts
    for a in alerts:
        cur.execute(
            """
            INSERT INTO alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(a.id),
                str(a.rule_id),
                str(a.title),
                str(a.severity),
                str(a.explanation),
                str(a.evidence),
                str(a.source_ip or ""),
                str(a.dest_ip or ""),
                int(a.event_count),
                str(a.recommendation),
                str(a.disclaimer),
            ),
        )

    # Insert Packets
    packet_rows = []
    for p in packets:
        packet_rows.append((
            int(p.packet_number),
            str(p.timestamp),
            float(p.relative_time),
            p.source_mac,
            p.dest_mac,
            p.source_ip,
            p.dest_ip,
            p.ip_version,
            p.transport_protocol,
            p.source_port,
            p.dest_port,
            int(p.packet_length),
            p.tcp_flags,
            p.dns_query_name,
            p.dns_query_type,
            p.http_method,
            p.http_host,
            p.http_uri,
            p.icmp_type,
            p.summary_info,
        ))

    cur.executemany(
        """
        INSERT INTO packets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        packet_rows,
    )

    conn.commit()
    conn.close()
    return output_path
