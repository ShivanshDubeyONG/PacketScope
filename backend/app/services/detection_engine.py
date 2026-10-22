"""Transparent, deterministic rule-based network detection engine for PacketScope."""

import json
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Tuple
from backend.app.core.config import settings
from backend.app.core.logging import logger

DISCLAIMER_TEXT = (
    "This alert indicates suspicious traffic behavior detected by transparent deterministic heuristics, "
    "not confirmed host compromise or malicious intrusion."
)


def calculate_risk_score(alerts: List[Dict[str, Any]]) -> Tuple[int, str]:
    """
    Calculate a composite heuristic risk score (0-100) and risk level.
    Score is heuristic and not a probability of compromise.
    """
    if not alerts:
        return 0, "NONE"

    severity_weights = {
        "CRITICAL": 35,
        "HIGH": 20,
        "MEDIUM": 10,
        "LOW": 5,
    }

    raw_score = sum(severity_weights.get(a.get("severity", "LOW"), 5) for a in alerts)
    score = min(100, raw_score)

    if score == 0:
        level = "NONE"
    elif score <= 25:
        level = "LOW"
    elif score <= 55:
        level = "MEDIUM"
    elif score <= 80:
        level = "HIGH"
    else:
        level = "CRITICAL"

    return score, level


def evaluate_rules(packets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Evaluate all deterministic defensive rules against parsed packet metadata."""
    if not packets:
        return []

    alerts: List[Dict[str, Any]] = []

    # -------------------------------------------------------------
    # Rule 1: Possible Port Scan
    # One source contacting distinct destination ports on a target
    # -------------------------------------------------------------
    scan_track: Dict[Tuple[str, str], List[Tuple[float, int, datetime]]] = defaultdict(list)
    for pkt in packets:
        src = pkt.get("source_ip")
        dst = pkt.get("dest_ip")
        dport = pkt.get("dest_port")
        ts = pkt.get("timestamp")
        rel = pkt.get("relative_time", 0.0)
        if src and dst and dport:
            scan_track[(src, dst)].append((rel, dport, ts))

    for (src, dst), events in scan_track.items():
        events.sort(key=lambda x: x[0])
        # Sliding window check
        window = settings.PORT_SCAN_WINDOW_SECONDS
        distinct_ports = {ev[1] for ev in events}
        if len(distinct_ports) >= settings.PORT_SCAN_PORT_THRESHOLD:
            # Check window clustering
            first_ts = events[0][2]
            last_ts = events[-1][2]
            alerts.append({
                "rule_id": "RULE_PORT_SCAN",
                "title": "Possible Port Scan Detected",
                "severity": "HIGH",
                "explanation": (
                    f"Source host {src} sent traffic to {len(distinct_ports)} distinct destination ports "
                    f"on target {dst} within {window}s. This pattern strongly resembles an automated port probe or service discovery sweep."
                ),
                "evidence": json.dumps({
                    "source_ip": src,
                    "target_ip": dst,
                    "distinct_ports_contacted": len(distinct_ports),
                    "sampled_ports": sorted(list(distinct_ports))[:20],
                    "threshold": settings.PORT_SCAN_PORT_THRESHOLD,
                }),
                "source_ip": src,
                "dest_ip": dst,
                "source_port": None,
                "dest_port": None,
                "first_seen": first_ts,
                "last_seen": last_ts,
                "event_count": len(events),
                "recommendation": (
                    "Inspect the source IP address in firewall logs. Determine if the host is an authorized vulnerability "
                    "scanner or network inventory tool. Verify that perimeter access controls restrict unneeded exposed ports."
                ),
                "disclaimer": DISCLAIMER_TEXT,
            })

    # -------------------------------------------------------------
    # Rule 2: Connection Burst
    # One source initiates high number of connections in short window
    # -------------------------------------------------------------
    src_burst_track: Dict[str, List[Tuple[float, datetime]]] = defaultdict(list)
    for pkt in packets:
        src = pkt.get("source_ip")
        flags = pkt.get("tcp_flags") or ""
        proto = pkt.get("transport_protocol")
        ts = pkt.get("timestamp")
        rel = pkt.get("relative_time", 0.0)

        # Connection initiation: TCP SYN without ACK, or UDP initial request
        if src and (("S" in flags and "A" not in flags) or proto == "UDP"):
            src_burst_track[src].append((rel, ts))

    burst_threshold = settings.CONNECTION_BURST_COUNT
    burst_window = settings.CONNECTION_BURST_WINDOW_SECONDS

    for src, events in src_burst_track.items():
        if len(events) >= burst_threshold:
            events.sort(key=lambda x: x[0])
            first_seen = events[0][1]
            last_seen = events[-1][1]
            alerts.append({
                "rule_id": "RULE_CONNECTION_BURST",
                "title": "Connection Initiation Burst",
                "severity": "MEDIUM",
                "explanation": (
                    f"Source host {src} generated {len(events)} connection attempts within a short interval, "
                    f"exceeding the baseline threshold of {burst_threshold} connections."
                ),
                "evidence": json.dumps({
                    "source_ip": src,
                    "total_burst_connections": len(events),
                    "configured_threshold": burst_threshold,
                    "window_seconds": burst_window,
                }),
                "source_ip": src,
                "dest_ip": None,
                "source_port": None,
                "dest_port": None,
                "first_seen": first_seen,
                "last_seen": last_seen,
                "event_count": len(events),
                "recommendation": (
                    "Review application behavior on the originating host. Determine if this burst correlates with "
                    "a legitimate scheduled job, API batch load, or an aggressive client retry loop."
                ),
                "disclaimer": DISCLAIMER_TEXT,
            })

    # -------------------------------------------------------------
    # Rule 3: Repeated TCP SYN Activity
    # High number of SYN packets without proportionate completed handshakes
    # -------------------------------------------------------------
    tcp_syn_count = 0
    tcp_fin_ack_count = 0
    syn_sources: Dict[str, int] = Counter() if False else defaultdict(int)
    syn_first_ts = None
    syn_last_ts = None

    for pkt in packets:
        flags = pkt.get("tcp_flags") or ""
        ts = pkt.get("timestamp")
        src = pkt.get("source_ip")
        if "S" in flags and "A" not in flags:
            tcp_syn_count += 1
            if src:
                syn_sources[src] += 1
            if not syn_first_ts:
                syn_first_ts = ts
            syn_last_ts = ts
        elif "F" in flags or ("A" in flags and "S" not in flags):
            tcp_fin_ack_count += 1

    syn_threshold = settings.SYN_BURST_THRESHOLD
    if tcp_syn_count >= syn_threshold:
        ratio = (tcp_syn_count / max(1, tcp_fin_ack_count))
        if ratio >= settings.SYN_TO_FIN_RATIO:
            top_syn_src = max(syn_sources.items(), key=lambda x: x[1])[0] if syn_sources else None
            alerts.append({
                "rule_id": "RULE_REPEATED_TCP_SYN",
                "title": "Repeated TCP SYN Activity (Potential SYN Flood)",
                "severity": "HIGH",
                "explanation": (
                    f"Observed {tcp_syn_count} TCP SYN packets with only {tcp_fin_ack_count} completed/terminated "
                    f"session packets (ratio {ratio:.1f}:1). This indicates half-open connection attempts or SYN flooding."
                ),
                "evidence": json.dumps({
                    "total_syn_packets": tcp_syn_count,
                    "fin_ack_packets": tcp_fin_ack_count,
                    "syn_ratio": round(ratio, 2),
                    "primary_syn_source": top_syn_src,
                    "threshold": syn_threshold,
                }),
                "source_ip": top_syn_src,
                "dest_ip": None,
                "source_port": None,
                "dest_port": None,
                "first_seen": syn_first_ts,
                "last_seen": syn_last_ts,
                "event_count": tcp_syn_count,
                "recommendation": (
                    "Enable TCP SYN cookies on receiving endpoints and verify perimeter anti-DDoS rate limiting "
                    "to prevent TCP connection pool starvation."
                ),
                "disclaimer": DISCLAIMER_TEXT,
            })

    # -------------------------------------------------------------
    # Rule 4: Suspicious or Uncommon Port Activity
    # Communication involving monitored or commonly abused service ports
    # -------------------------------------------------------------
    monitored = set(settings.monitored_ports_list)
    monitored_hits: List[Dict[str, Any]] = []
    for pkt in packets:
        sport = pkt.get("source_port")
        dport = pkt.get("dest_port")
        matched_port = None
        if dport in monitored:
            matched_port = dport
        elif sport in monitored:
            matched_port = sport

        if matched_port:
            monitored_hits.append({
                "port": matched_port,
                "src": pkt.get("source_ip"),
                "dst": pkt.get("dest_ip"),
                "proto": pkt.get("transport_protocol"),
                "timestamp": pkt.get("timestamp"),
            })

    if monitored_hits:
        ports_involved = sorted(list({h["port"] for h in monitored_hits}))
        first_seen = monitored_hits[0]["timestamp"]
        last_seen = monitored_hits[-1]["timestamp"]
        primary_hit = monitored_hits[0]
        alerts.append({
            "rule_id": "RULE_SUSPICIOUS_PORT_ACTIVITY",
            "title": "Suspicious / Uncommon Port Activity",
            "severity": "HIGH",
            "explanation": (
                f"Traffic detected on monitored or sensitive administrative/legacy ports: {ports_involved}. "
                "These ports are frequently targeted for exploit payloads, remote administration, or IRC control channels."
            ),
            "evidence": json.dumps({
                "monitored_ports_detected": ports_involved,
                "hit_count": len(monitored_hits),
                "sample_endpoints": [
                    {"src": h["src"], "dst": h["dst"], "port": h["port"]}
                    for h in monitored_hits[:10]
                ],
            }),
            "source_ip": primary_hit["src"],
            "dest_ip": primary_hit["dst"],
            "source_port": primary_hit["port"],
            "dest_port": primary_hit["port"],
            "first_seen": first_seen,
            "last_seen": last_seen,
            "event_count": len(monitored_hits),
            "recommendation": (
                "Audit traffic to verify if legacy services (Telnet/FTP) or unexpected listeners are intentionally running. "
                "Block unapproved ingress ports at the perimeter firewall."
            ),
            "disclaimer": DISCLAIMER_TEXT,
        })

    # -------------------------------------------------------------
    # Rule 5: ICMP Flood Indicator
    # ICMP packet count exceeds threshold
    # -------------------------------------------------------------
    icmp_packets = [p for p in packets if p.get("transport_protocol") == "ICMP"]
    if len(icmp_packets) >= settings.ICMP_FLOOD_PACKET_THRESHOLD:
        src_counts = defaultdict(int)
        for p in icmp_packets:
            if p.get("source_ip"):
                src_counts[p.get("source_ip")] += 1
        top_icmp_src = max(src_counts.items(), key=lambda x: x[1])[0] if src_counts else None
        alerts.append({
            "rule_id": "RULE_ICMP_FLOOD",
            "title": "High Volume ICMP Traffic (Flood Indicator)",
            "severity": "MEDIUM",
            "explanation": (
                f"Recorded {len(icmp_packets)} ICMP packets, surpassing the threshold of "
                f"{settings.ICMP_FLOOD_PACKET_THRESHOLD} packets. Rapid ICMP rates are characteristic of ping sweeps or ICMP flood degradation."
            ),
            "evidence": json.dumps({
                "icmp_packet_count": len(icmp_packets),
                "threshold": settings.ICMP_FLOOD_PACKET_THRESHOLD,
                "primary_source": top_icmp_src,
            }),
            "source_ip": top_icmp_src,
            "dest_ip": None,
            "source_port": None,
            "dest_port": None,
            "first_seen": icmp_packets[0]["timestamp"],
            "last_seen": icmp_packets[-1]["timestamp"],
            "event_count": len(icmp_packets),
            "recommendation": (
                "Apply ICMP rate-limiting on network interfaces and edge routers. Ensure ping requests do not degrade bandwidth."
            ),
            "disclaimer": DISCLAIMER_TEXT,
        })

    # -------------------------------------------------------------
    # Rule 6: Large DNS Query Indicator
    # DNS queries exceeding length threshold
    # -------------------------------------------------------------
    large_dns_packets = []
    for pkt in packets:
        qname = pkt.get("dns_query_name")
        if qname and len(qname) >= settings.LARGE_DNS_QUERY_LENGTH:
            large_dns_packets.append(pkt)

    if large_dns_packets:
        first_seen = large_dns_packets[0]["timestamp"]
        last_seen = large_dns_packets[-1]["timestamp"]
        sampled_queries = [p.get("dns_query_name") for p in large_dns_packets[:5]]
        alerts.append({
            "rule_id": "RULE_LARGE_DNS_QUERY",
            "title": "Abnormally Large DNS Query (Tunneling Indicator)",
            "severity": "HIGH",
            "explanation": (
                f"Observed {len(large_dns_packets)} DNS queries containing query names >= "
                f"{settings.LARGE_DNS_QUERY_LENGTH} characters. Abnormally long query labels are commonly utilized in DNS covert tunneling or base-encoded data exfiltration."
            ),
            "evidence": json.dumps({
                "count": len(large_dns_packets),
                "threshold_length": settings.LARGE_DNS_QUERY_LENGTH,
                "sample_queries": sampled_queries,
            }),
            "source_ip": large_dns_packets[0].get("source_ip"),
            "dest_ip": large_dns_packets[0].get("dest_ip"),
            "source_port": large_dns_packets[0].get("source_port"),
            "dest_port": 53,
            "first_seen": first_seen,
            "last_seen": last_seen,
            "event_count": len(large_dns_packets),
            "recommendation": (
                "Inspect recursive resolver query logs for high-entropy subdomains. Configure DNS response rate limiting (RRL) "
                "and DNS inspection policies to block unauthorized tunneling protocols."
            ),
            "disclaimer": DISCLAIMER_TEXT,
        })

    # -------------------------------------------------------------
    # Rule 7: Unencrypted Application Protocol
    # HTTP, FTP, or Telnet detected
    # -------------------------------------------------------------
    cleartext_packets = []
    cleartext_protocols = set()
    for pkt in packets:
        proto = pkt.get("transport_protocol")
        dport = pkt.get("dest_port")
        sport = pkt.get("source_port")
        if proto == "HTTP" or dport in (80, 8080, 21, 23) or sport in (80, 8080, 21, 23):
            cleartext_packets.append(pkt)
            if proto == "HTTP" or dport in (80, 8080) or sport in (80, 8080):
                cleartext_protocols.add("HTTP")
            if dport == 21 or sport == 21:
                cleartext_protocols.add("FTP")
            if dport == 23 or sport == 23:
                cleartext_protocols.add("Telnet")

    if cleartext_packets:
        first_seen = cleartext_packets[0]["timestamp"]
        last_seen = cleartext_packets[-1]["timestamp"]
        alerts.append({
            "rule_id": "RULE_UNENCRYPTED_PROTOCOL",
            "title": "Unencrypted Cleartext Protocol In Use",
            "severity": "LOW",
            "explanation": (
                f"Detected unencrypted application protocols ({', '.join(sorted(cleartext_protocols))}) in network traffic. "
                "Transmitting traffic without TLS encryption exposes headers and URLs to eavesdropping and interception."
            ),
            "evidence": json.dumps({
                "detected_protocols": sorted(list(cleartext_protocols)),
                "packet_count": len(cleartext_packets),
            }),
            "source_ip": cleartext_packets[0].get("source_ip"),
            "dest_ip": cleartext_packets[0].get("dest_ip"),
            "source_port": cleartext_packets[0].get("source_port"),
            "dest_port": cleartext_packets[0].get("dest_port"),
            "first_seen": first_seen,
            "last_seen": last_seen,
            "event_count": len(cleartext_packets),
            "recommendation": (
                "Migrate plain HTTP, FTP, and Telnet communications to modern encrypted standards: HTTPS (TLS 1.3), SFTP/SCP, and SSH."
            ),
            "disclaimer": DISCLAIMER_TEXT,
        })

    # -------------------------------------------------------------
    # Rule 8: Single-Source Traffic Concentration
    # One source contributes high share of capture traffic
    # -------------------------------------------------------------
    total_packets = len(packets)
    if total_packets >= 10:
        src_totals = defaultdict(int)
        for pkt in packets:
            src = pkt.get("source_ip")
            if src:
                src_totals[src] += 1

        threshold_ratio = settings.TRAFFIC_CONCENTRATION_THRESHOLD
        for src, count in src_totals.items():
            ratio = count / total_packets
            if ratio >= threshold_ratio:
                alerts.append({
                    "rule_id": "RULE_TRAFFIC_CONCENTRATION",
                    "title": "High Single-Source Traffic Concentration",
                    "severity": "LOW",
                    "explanation": (
                        f"Host {src} produced {count} of {total_packets} packets ({ratio * 100:.1f}% of total capture volume), "
                        f"surpassing the concentration threshold of {threshold_ratio * 100:.0f}%."
                    ),
                    "evidence": json.dumps({
                        "source_ip": src,
                        "source_packets": count,
                        "total_capture_packets": total_packets,
                        "ratio_percentage": round(ratio * 100, 1),
                        "threshold_percentage": round(threshold_ratio * 100, 1),
                    }),
                    "source_ip": src,
                    "dest_ip": None,
                    "source_port": None,
                    "dest_port": None,
                    "first_seen": packets[0]["timestamp"],
                    "last_seen": packets[-1]["timestamp"],
                    "event_count": count,
                    "recommendation": (
                        "Verify whether the concentrated traffic pattern reflects ordinary endpoint behavior (e.g. streaming, backup agent, speedtest) "
                        "or an unthrottled sender."
                    ),
                    "disclaimer": DISCLAIMER_TEXT,
                })

    return alerts
