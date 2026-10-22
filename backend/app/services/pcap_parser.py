"""PCAP and PCAPNG parsing service using PyShark / TShark and Scapy."""

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import pyshark
from scapy.all import rdpcap, IP, IPv6, TCP, UDP, ICMP, DNS, Ether

from backend.app.core.config import settings
from backend.app.core.exceptions import InvalidCaptureFileError, TSharkNotFoundError
from backend.app.core.logging import logger


def validate_capture_file(file_path: str) -> None:
    """Validate file existence, non-empty status, and PCAP/PCAPNG magic byte signature."""
    if not os.path.isfile(file_path):
        raise InvalidCaptureFileError(f"Capture file not found: {file_path}")

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise InvalidCaptureFileError("Capture file is empty (0 bytes).")

    with open(file_path, "rb") as f:
        header = f.read(4)

    # Standard PCAP magic numbers:
    # 0xa1b2c3d4 (standard microseconds, big-endian)
    # 0xd4c3b2a1 (standard microseconds, little-endian)
    # 0xa1b23c4d (nanoseconds, big-endian)
    # 0x4d3cb2a1 (nanoseconds, little-endian)
    # PCAPNG: 0x0a0d0d0a (\n\r\r\n section header block)
    valid_magics = [
        b"\xa1\xb2\xc3\xd4",
        b"\xd4\xc3\xb2\xa1",
        b"\xa1\xb2\x3c\x4d",
        b"\x4d\x3c\xb2\xa1",
        b"\x0a\x0d\x0d\x0a",
    ]

    if header not in valid_magics:
        raise InvalidCaptureFileError(
            f"Invalid file signature (magic bytes: {header.hex()}). "
            "File is not a valid standard PCAP or PCAPNG capture."
        )


def parse_packet_pyshark(pkt: Any, packet_num: int, capture_start_epoch: float) -> Dict[str, Any]:
    """Extract normalized metadata from a PyShark packet object."""
    try:
        epoch = float(pkt.sniff_timestamp)
        dt = datetime.fromtimestamp(epoch, tz=timezone.utc)
    except Exception:
        dt = datetime.now(timezone.utc)
        epoch = dt.timestamp()

    rel_time = max(0.0, epoch - capture_start_epoch) if capture_start_epoch > 0 else 0.0

    src_mac = None
    dst_mac = None
    if hasattr(pkt, "eth"):
        src_mac = getattr(pkt.eth, "src", None)
        dst_mac = getattr(pkt.eth, "dst", None)

    src_ip = None
    dst_ip = None
    ip_ver = None
    if hasattr(pkt, "ip"):
        src_ip = getattr(pkt.ip, "src", None)
        dst_ip = getattr(pkt.ip, "dst", None)
        ip_ver = 4
    elif hasattr(pkt, "ipv6"):
        src_ip = getattr(pkt.ipv6, "src", None)
        dst_ip = getattr(pkt.ipv6, "dst", None)
        ip_ver = 6

    highest_proto = getattr(pkt, "highest_layer", "UNKNOWN").upper()
    transport_proto = "OTHER"
    src_port = None
    dst_port = None
    tcp_flags = None

    if hasattr(pkt, "tcp"):
        transport_proto = "TCP"
        try:
            src_port = int(getattr(pkt.tcp, "srcport", 0)) or None
            dst_port = int(getattr(pkt.tcp, "dstport", 0)) or None
        except Exception:
            pass
        tcp_flags = getattr(pkt.tcp, "flags_str", None) or getattr(pkt.tcp, "flags", None)
    elif hasattr(pkt, "udp"):
        transport_proto = "UDP"
        try:
            src_port = int(getattr(pkt.udp, "srcport", 0)) or None
            dst_port = int(getattr(pkt.udp, "dstport", 0)) or None
        except Exception:
            pass
    elif hasattr(pkt, "icmp") or hasattr(pkt, "icmpv6"):
        transport_proto = "ICMP"

    # Application protocol metadata
    dns_qname = None
    dns_qtype = None
    if hasattr(pkt, "dns"):
        transport_proto = "DNS"
        dns_qname = getattr(pkt.dns, "qry_name", None)
        dns_qtype = getattr(pkt.dns, "qry_type", None)

    http_method = None
    http_host = None
    http_uri = None
    if hasattr(pkt, "http"):
        transport_proto = "HTTP"
        http_method = getattr(pkt.http, "request_method", None)
        http_host = getattr(pkt.http, "host", None)
        http_uri = getattr(pkt.http, "request_uri", None)

    icmp_type = None
    if hasattr(pkt, "icmp"):
        try:
            icmp_type = int(getattr(pkt.icmp, "type", 0))
        except Exception:
            pass

    try:
        pkt_len = int(getattr(pkt, "length", 0))
    except Exception:
        pkt_len = 0

    summary = f"{transport_proto} {src_ip or src_mac}:{src_port or ''} -> {dst_ip or dst_mac}:{dst_port or ''}"

    return {
        "packet_number": packet_num,
        "timestamp": dt,
        "relative_time": round(rel_time, 4),
        "source_mac": src_mac,
        "dest_mac": dst_mac,
        "source_ip": src_ip,
        "dest_ip": dst_ip,
        "ip_version": ip_ver,
        "transport_protocol": transport_proto,
        "source_port": src_port,
        "dest_port": dst_port,
        "packet_length": pkt_len,
        "tcp_flags": str(tcp_flags) if tcp_flags else None,
        "dns_query_name": str(dns_qname) if dns_qname else None,
        "dns_query_type": str(dns_qtype) if dns_qtype else None,
        "http_method": str(http_method) if http_method else None,
        "http_host": str(http_host) if http_host else None,
        "http_uri": str(http_uri) if http_uri else None,
        "icmp_type": icmp_type,
        "summary_info": summary[:500],
    }


def parse_packet_scapy(pkt: Any, packet_num: int, capture_start_epoch: float) -> Dict[str, Any]:
    """Fallback extraction using Scapy for robust packet decoding."""
    try:
        epoch = float(pkt.time)
        dt = datetime.fromtimestamp(epoch, tz=timezone.utc)
    except Exception:
        dt = datetime.now(timezone.utc)
        epoch = dt.timestamp()

    rel_time = max(0.0, epoch - capture_start_epoch) if capture_start_epoch > 0 else 0.0

    src_mac = None
    dst_mac = None
    if Ether in pkt:
        src_mac = pkt[Ether].src
        dst_mac = pkt[Ether].dst

    src_ip = None
    dst_ip = None
    ip_ver = None
    if IP in pkt:
        src_ip = pkt[IP].src
        dst_ip = pkt[IP].dst
        ip_ver = 4
    elif IPv6 in pkt:
        src_ip = pkt[IPv6].src
        dst_ip = pkt[IPv6].dst
        ip_ver = 6

    transport_proto = "OTHER"
    src_port = None
    dest_port = None
    tcp_flags = None

    if TCP in pkt:
        transport_proto = "TCP"
        src_port = int(pkt[TCP].sport)
        dest_port = int(pkt[TCP].dport)
        tcp_flags = str(pkt[TCP].flags)
    elif UDP in pkt:
        transport_proto = "UDP"
        src_port = int(pkt[UDP].sport)
        dest_port = int(pkt[UDP].dport)
    elif ICMP in pkt:
        transport_proto = "ICMP"

    # DNS detection
    dns_qname = None
    dns_qtype = None
    if DNS in pkt and pkt[DNS].qd:
        transport_proto = "DNS"
        try:
            qname_bytes = pkt[DNS].qd.qname
            dns_qname = qname_bytes.decode("utf-8", errors="ignore").rstrip(".")
            dns_qtype = str(pkt[DNS].qd.qtype)
        except Exception:
            pass

    # HTTP detection
    http_method = None
    http_host = None
    http_uri = None
    icmp_type = None

    if ICMP in pkt:
        icmp_type = int(pkt[ICMP].type)

    if TCP in pkt and (src_port == 80 or dest_port == 80 or src_port == 8080 or dest_port == 8080):
        # Check for HTTP text
        try:
            raw_payload = bytes(pkt[TCP].payload)
            if raw_payload:
                text = raw_payload[:300].decode("latin-1", errors="ignore")
                for method in ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]:
                    if text.startswith(method + " "):
                        transport_proto = "HTTP"
                        parts = text.split(" ")
                        http_method = parts[0]
                        if len(parts) > 1:
                            http_uri = parts[1]
                        for line in text.split("\r\n"):
                            if line.lower().startswith("host:"):
                                http_host = line.split(":", 1)[1].strip()
                        break
        except Exception:
            pass

    pkt_len = len(pkt)
    summary = f"{transport_proto} {src_ip or src_mac}:{src_port or ''} -> {dst_ip or dst_mac}:{dest_port or ''}"

    return {
        "packet_number": packet_num,
        "timestamp": dt,
        "relative_time": round(rel_time, 4),
        "source_mac": src_mac,
        "dest_mac": dst_mac,
        "source_ip": src_ip,
        "dest_ip": dst_ip,
        "ip_version": ip_ver,
        "transport_protocol": transport_proto,
        "source_port": src_port,
        "dest_port": dest_port,
        "packet_length": pkt_len,
        "tcp_flags": tcp_flags,
        "dns_query_name": dns_qname,
        "dns_query_type": dns_qtype,
        "http_method": http_method,
        "http_host": http_host,
        "http_uri": http_uri,
        "icmp_type": icmp_type,
        "summary_info": summary[:500],
    }


def parse_pcap_file(file_path: str, prefer_pyshark: bool = True) -> List[Dict[str, Any]]:
    """
    Parse a PCAP or PCAPNG file and extract list of normalized packet metadata dictionaries.
    Uses PyShark with TShark as primary engine. If TShark is not available, raises TSharkNotFoundError.
    """
    validate_capture_file(file_path)

    tshark_path = settings.resolved_tshark_path
    if not tshark_path:
        logger.error("TShark path not resolved. PyShark cannot run without TShark.")
        raise TSharkNotFoundError()

    packets: List[Dict[str, Any]] = []

    if prefer_pyshark:
        logger.info("Parsing %s using PyShark (TShark: %s)", file_path, tshark_path)
        cap = None
        try:
            cap = pyshark.FileCapture(
                input_file=file_path,
                tshark_path=tshark_path,
                keep_packets=False,
            )

            capture_start_epoch: float = 0.0
            idx = 1
            for pkt in cap:
                if idx == 1:
                    try:
                        capture_start_epoch = float(pkt.sniff_timestamp)
                    except Exception:
                        capture_start_epoch = 0.0
                parsed = parse_packet_pyshark(pkt, idx, capture_start_epoch)
                packets.append(parsed)
                idx += 1

            logger.info("Successfully parsed %d packets via PyShark.", len(packets))
            return packets
        except Exception as exc:
            logger.warning("PyShark parse encountered error: %s. Falling back to Scapy.", exc)
        finally:
            if cap is not None:
                try:
                    import asyncio
                    try:
                        loop = asyncio.get_event_loop()
                        if not loop.is_closed() and not loop.is_running():
                            loop.run_until_complete(cap.close_async())
                        else:
                            cap.close()
                    except Exception:
                        cap.close()
                except Exception:
                    pass

    # Scapy fallback parsing
    logger.info("Parsing %s using Scapy engine.", file_path)
    scapy_packets = rdpcap(file_path)
    start_epoch = float(scapy_packets[0].time) if len(scapy_packets) > 0 else 0.0

    for idx, pkt in enumerate(scapy_packets, start=1):
        parsed = parse_packet_scapy(pkt, idx, start_epoch)
        packets.append(parsed)

    logger.info("Successfully parsed %d packets via Scapy.", len(packets))
    return packets
