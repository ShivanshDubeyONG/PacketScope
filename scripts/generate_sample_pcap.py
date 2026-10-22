"""Synthetic safe PCAP generator using Scapy for testing and verification."""

import os
import sys
from pathlib import Path
from scapy.all import (
    Ether, IP, TCP, UDP, ICMP, DNS, DNSQR, Raw, wrpcap
)


def generate_synthetic_pcap(output_path: str) -> str:
    """Generate a clean, controlled synthetic PCAP file with safe test traffic patterns."""
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    packets = []

    base_time = 1700000000.0  # Stable synthetic timestamp epoch

    # 1. Standard DNS Request & Response
    dns_pkt = (
        Ether(src="00:11:22:33:44:55", dst="00:aa:bb:cc:dd:ee")
        / IP(src="192.168.1.100", dst="8.8.8.8")
        / UDP(sport=53211, dport=53)
        / DNS(rd=1, qd=DNSQR(qname="api.packetscope.local"))
    )
    dns_pkt.time = base_time + 0.1
    packets.append(dns_pkt)

    # 2. Large DNS Query (Tunneling Indicator: > 60 characters)
    large_dns = (
        Ether(src="00:11:22:33:44:55", dst="00:aa:bb:cc:dd:ee")
        / IP(src="192.168.1.100", dst="8.8.8.8")
        / UDP(sport=53212, dport=53)
        / DNS(rd=1, qd=DNSQR(qname="exfil-chunk-alpha-0012938475620194857201928374650192837465.defense.sample.local"))
    )
    large_dns.time = base_time + 0.3
    packets.append(large_dns)

    # 3. Cleartext HTTP Request (Unencrypted Application Protocol)
    http_payload = b"GET /dashboard/metrics HTTP/1.1\r\nHost: internal-service.local\r\nUser-Agent: PacketScopeTest/1.0\r\n\r\n"
    http_pkt = (
        Ether(src="00:11:22:33:44:55", dst="00:aa:bb:cc:dd:ee")
        / IP(src="192.168.1.100", dst="10.0.0.50")
        / TCP(sport=49152, dport=80, flags="PA")
        / Raw(load=http_payload)
    )
    http_pkt.time = base_time + 0.5
    packets.append(http_pkt)

    # 4. Monitored Port Access (Port 4444 - Suspicious Port Activity)
    monitored_pkt = (
        Ether(src="00:11:22:33:44:55", dst="00:aa:bb:cc:dd:ee")
        / IP(src="192.168.1.100", dst="10.0.0.77")
        / TCP(sport=51234, dport=4444, flags="S")
    )
    monitored_pkt.time = base_time + 0.7
    packets.append(monitored_pkt)

    # 5. Simulated Safe Port Scan (Source 192.168.1.200 scanning ports 20 through 40 on 10.0.0.1)
    # 21 distinct ports contacted within 2 seconds
    for p_idx, target_port in enumerate(range(20, 41)):
        scan_pkt = (
            Ether(src="00:11:22:33:44:99", dst="00:aa:bb:cc:dd:ee")
            / IP(src="192.168.1.200", dst="10.0.0.1")
            / TCP(sport=40000 + p_idx, dport=target_port, flags="S")
        )
        scan_pkt.time = base_time + 1.0 + (p_idx * 0.05)
        packets.append(scan_pkt)

    # 6. Repeated TCP SYN Packets (SYN flood indicator, 25 SYNs from 192.168.1.250)
    for s_idx in range(25):
        syn_pkt = (
            Ether(src="00:11:22:33:44:88", dst="00:aa:bb:cc:dd:ee")
            / IP(src="192.168.1.250", dst="10.0.0.2")
            / TCP(sport=50000 + s_idx, dport=80, flags="S")
        )
        syn_pkt.time = base_time + 2.5 + (s_idx * 0.02)
        packets.append(syn_pkt)

    # 7. ICMP Ping Burst (35 ICMP echo-request packets from 192.168.1.210)
    for i_idx in range(35):
        icmp_pkt = (
            Ether(src="00:11:22:33:44:77", dst="00:aa:bb:cc:dd:ee")
            / IP(src="192.168.1.210", dst="10.0.0.3")
            / ICMP(type=8, code=0)
            / Raw(load=b"PACKETSCOPE_ICMP_PROBE")
        )
        icmp_pkt.time = base_time + 3.5 + (i_idx * 0.03)
        packets.append(icmp_pkt)

    # 8. Single-source traffic concentration (Host 192.168.1.100 generates additional UDP packets)
    for u_idx in range(150):
        udp_pkt = (
            Ether(src="00:11:22:33:44:55", dst="00:aa:bb:cc:dd:ee")
            / IP(src="192.168.1.100", dst="192.168.1.1")
            / UDP(sport=60000 + (u_idx % 100), dport=9000)
            / Raw(load=b"traffic_volume_sample_payload")
        )
        udp_pkt.time = base_time + 4.5 + (u_idx * 0.02)
        packets.append(udp_pkt)

    # Write out capture file
    wrpcap(output_path, packets)
    print(f"Generated synthetic PCAP at {output_path} ({len(packets)} packets)")
    return output_path


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "sample_data/synthetic_sample.pcap"
    generate_synthetic_pcap(out)
