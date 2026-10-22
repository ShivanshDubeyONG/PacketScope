"""Statistics calculator service for network capture metadata."""

from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple


def calculate_capture_statistics(packets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate comprehensive, genuine capture statistics from parsed packet records."""
    total_packets = len(packets)
    if total_packets == 0:
        return {
            "total_packets": 0,
            "duration_seconds": 0.0,
            "start_time": None,
            "end_time": None,
            "total_bytes": 0,
            "avg_packet_size": 0.0,
            "packets_per_second": 0.0,
            "unique_src_ips": 0,
            "unique_dst_ips": 0,
            "protocol_distribution": {},
            "port_distribution": {},
            "top_talkers": [],
            "top_conversations": [],
            "time_series": [],
        }

    total_bytes = 0
    src_ips = set()
    dst_ips = set()
    proto_counts: Counter = Counter()
    port_counts: Counter = Counter()

    ip_stats: Dict[str, Dict[str, int]] = defaultdict(lambda: {"packets": 0, "bytes": 0})
    conv_stats: Dict[Tuple[str, str, str], Dict[str, int]] = defaultdict(lambda: {"packets": 0, "bytes": 0})
    time_buckets: Dict[str, Dict[str, int]] = defaultdict(lambda: {"packets": 0, "bytes": 0})

    start_dt = packets[0]["timestamp"]
    end_dt = packets[-1]["timestamp"]

    # Ensure timestamps are datetimes
    if isinstance(start_dt, str):
        start_dt = datetime.fromisoformat(start_dt)
    if isinstance(end_dt, str):
        end_dt = datetime.fromisoformat(end_dt)

    for pkt in packets:
        length = pkt.get("packet_length", 0)
        total_bytes += length

        src = pkt.get("source_ip")
        dst = pkt.get("dest_ip")
        proto = pkt.get("transport_protocol") or "UNKNOWN"
        src_port = pkt.get("source_port")
        dst_port = pkt.get("dest_port")
        ts = pkt.get("timestamp")

        if src:
            src_ips.add(src)
            ip_stats[src]["packets"] += 1
            ip_stats[src]["bytes"] += length

        if dst:
            dst_ips.add(dst)
            ip_stats[dst]["packets"] += 1
            ip_stats[dst]["bytes"] += length

        proto_counts[proto] += 1

        if dst_port:
            port_counts[str(dst_port)] += 1
        elif src_port:
            port_counts[str(src_port)] += 1

        if src and dst:
            conv_key = (src, dst, proto)
            conv_stats[conv_key]["packets"] += 1
            conv_stats[conv_key]["bytes"] += length

        # Time series bucket (by second)
        if isinstance(ts, datetime):
            bucket_key = ts.strftime("%Y-%m-%d %H:%M:%S")
        else:
            bucket_key = str(ts)[:19]
        time_buckets[bucket_key]["packets"] += 1
        time_buckets[bucket_key]["bytes"] += length

    # Calculate duration
    duration = max(0.0, (end_dt - start_dt).total_seconds())
    avg_size = round(total_bytes / total_packets, 2) if total_packets > 0 else 0.0
    pps = round(total_packets / duration, 2) if duration > 0 else float(total_packets)

    # Format top talkers (top 10)
    top_talkers_list = []
    for ip, data in sorted(ip_stats.items(), key=lambda item: item[1]["bytes"], reverse=True)[:10]:
        top_talkers_list.append({
            "ip": ip,
            "packet_count": data["packets"],
            "byte_count": data["bytes"],
            "role": "endpoint",
        })

    # Format top conversations (top 10)
    top_conversations_list = []
    for (src, dst, proto), data in sorted(conv_stats.items(), key=lambda item: item[1]["bytes"], reverse=True)[:10]:
        top_conversations_list.append({
            "source_ip": src,
            "dest_ip": dst,
            "protocol": proto,
            "packet_count": data["packets"],
            "byte_count": data["bytes"],
        })

    # Format time series
    time_series_list = []
    for bucket_key in sorted(time_buckets.keys()):
        time_series_list.append({
            "timestamp": bucket_key,
            "packet_count": time_buckets[bucket_key]["packets"],
            "byte_count": time_buckets[bucket_key]["bytes"],
        })

    # Port distribution (top 15)
    top_ports_dict = dict(port_counts.most_common(15))

    return {
        "total_packets": total_packets,
        "duration_seconds": round(duration, 3),
        "start_time": start_dt,
        "end_time": end_dt,
        "total_bytes": total_bytes,
        "avg_packet_size": avg_size,
        "packets_per_second": pps,
        "unique_src_ips": len(src_ips),
        "unique_dst_ips": len(dst_ips),
        "protocol_distribution": dict(proto_counts),
        "port_distribution": top_ports_dict,
        "top_talkers": top_talkers_list,
        "top_conversations": top_conversations_list,
        "time_series": time_series_list,
    }
