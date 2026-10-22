"""Generate distinct presentation-ready PCAP samples for live demonstration."""

import os
from scapy.all import Ether, IP, TCP, UDP, ICMP, DNS, DNSQR, Raw, wrpcap

BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_data")
os.makedirs(BASE_DIR, exist_ok=True)


def generate_demo_1_port_scan():
    """Demo 1: Reconnaissance Port Scan (Nmap SYN scan simulation)."""
    packets = []
    base_time = 1710001000.0
    src_mac = "00:50:56:c0:00:08"
    dst_mac = "00:0c:29:4f:8e:35"
    attacker_ip = "192.168.1.150"
    target_ip = "192.168.1.10"

    # Preliminary DNS lookup
    dns_pkt = (
        Ether(src=src_mac, dst=dst_mac)
        / IP(src=attacker_ip, dst="192.168.1.1")
        / UDP(sport=54123, dport=53)
        / DNS(rd=1, qd=DNSQR(qname="target-server.corp.local"))
    )
    dns_pkt.time = base_time
    packets.append(dns_pkt)

    # 35 distinct ports scanned in rapid succession
    ports = [
        21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995,
        1433, 1521, 2049, 3306, 3389, 5432, 5900, 8000, 8080, 8443, 8888,
        9000, 9200, 27017, 4444, 1337, 31337, 6667, 5555, 6379, 11211
    ]

    for idx, port in enumerate(ports):
        syn_pkt = (
            Ether(src=src_mac, dst=dst_mac)
            / IP(src=attacker_ip, dst=target_ip)
            / TCP(sport=49152 + idx, dport=port, flags="S")
        )
        syn_pkt.time = base_time + 0.1 + (idx * 0.04)
        packets.append(syn_pkt)

    output = os.path.join(BASE_DIR, "demo_port_scan.pcap")
    wrpcap(output, packets)
    print(f"[Demo 1] Created: {output} ({len(packets)} packets)")
    return output


def generate_demo_2_web_traffic():
    """Demo 2: Web Application Traffic (HTTP cleartext, APIs, benign DNS)."""
    packets = []
    base_time = 1710002000.0
    client_ip = "10.0.0.45"
    web_server_ip = "10.0.0.80"

    # DNS queries
    domains = ["portal.intra.net", "api.intra.net", "assets.intra.net"]
    for idx, d in enumerate(domains):
        pkt = (
            Ether()
            / IP(src=client_ip, dst="10.0.0.1")
            / UDP(sport=52000 + idx, dport=53)
            / DNS(rd=1, qd=DNSQR(qname=d))
        )
        pkt.time = base_time + (idx * 0.2)
        packets.append(pkt)

    # HTTP requests
    requests = [
        ("GET", "/index.html", "portal.intra.net"),
        ("GET", "/static/css/styles.css", "assets.intra.net"),
        ("GET", "/static/js/app.js", "assets.intra.net"),
        ("POST", "/api/v1/auth/login", "api.intra.net"),
        ("GET", "/dashboard/metrics", "portal.intra.net"),
        ("GET", "/admin/config.php", "portal.intra.net"),
    ]

    for idx, (method, uri, host) in enumerate(requests):
        payload = f"{method} {uri} HTTP/1.1\r\nHost: {host}\r\nUser-Agent: Mozilla/5.0 DefensiveAudit/2.0\r\n\r\n".encode()
        http_pkt = (
            Ether()
            / IP(src=client_ip, dst=web_server_ip)
            / TCP(sport=55000 + idx, dport=80, flags="PA")
            / Raw(load=payload)
        )
        http_pkt.time = base_time + 1.0 + (idx * 0.3)
        packets.append(http_pkt)

    # Add background TCP ACK handshakes and return traffic
    for idx in range(30):
        ack = (
            Ether()
            / IP(src=web_server_ip, dst=client_ip)
            / TCP(sport=80, dport=55000 + (idx % 6), flags="A")
        )
        ack.time = base_time + 1.2 + (idx * 0.08)
        packets.append(ack)

    output = os.path.join(BASE_DIR, "demo_web_cleartext.pcap")
    wrpcap(output, packets)
    print(f"[Demo 2] Created: {output} ({len(packets)} packets)")
    return output


def generate_demo_3_multi_threat():
    """Demo 3: Multi-Threat Intrusion Incident (Port scan, ICMP flood, DNS tunnel, C2 port)."""
    packets = []
    base_time = 1710003000.0
    threat_actor = "192.168.100.99"
    target_server = "192.168.100.5"

    # Stage 1: ICMP flood / ping probe (35 packets)
    for i in range(35):
        icmp_pkt = (
            Ether()
            / IP(src=threat_actor, dst=target_server)
            / ICMP(type=8, code=0)
            / Raw(load=b"DESTRUCTIVE_SWEEP_PAYLOAD")
        )
        icmp_pkt.time = base_time + (i * 0.03)
        packets.append(icmp_pkt)

    # Stage 2: DNS covert exfiltration tunnel (>60 chars query)
    covert_queries = [
        "c2-exfil-data-chunk-01-base64encryptedtokencontent.tunnel.attacker.cc",
        "c2-exfil-data-chunk-02-systemcredsdumphashsamplepayload.tunnel.attacker.cc",
    ]
    for idx, q in enumerate(covert_queries):
        dns_tunnel = (
            Ether()
            / IP(src=threat_actor, dst="8.8.8.8")
            / UDP(sport=53000 + idx, dport=53)
            / DNS(rd=1, qd=DNSQR(qname=q))
        )
        dns_tunnel.time = base_time + 1.5 + (idx * 0.2)
        packets.append(dns_tunnel)

    # Stage 3: Monitored C2 Ports (Metasploit 4444, Back Orifice 31337)
    for port in [4444, 31337]:
        c2_pkt = (
            Ether()
            / IP(src=threat_actor, dst=target_server)
            / TCP(sport=56789, dport=port, flags="S")
        )
        c2_pkt.time = base_time + 2.0
        packets.append(c2_pkt)

    # Stage 4: SYN flood connection attempts (25 half-open SYNs)
    for s_idx in range(25):
        syn = (
            Ether()
            / IP(src=threat_actor, dst=target_server)
            / TCP(sport=58000 + s_idx, dport=80, flags="S")
        )
        syn.time = base_time + 2.5 + (s_idx * 0.02)
        packets.append(syn)

    # Stage 5: Unencrypted HTTP probe
    payload = b"GET /admin/backup.tar.gz HTTP/1.1\r\nHost: target-server\r\n\r\n"
    http_probe = (
        Ether()
        / IP(src=threat_actor, dst=target_server)
        / TCP(sport=59001, dport=80, flags="PA")
        / Raw(load=payload)
    )
    http_probe.time = base_time + 3.2
    packets.append(http_probe)

    output = os.path.join(BASE_DIR, "demo_multi_threat.pcap")
    wrpcap(output, packets)
    print(f"[Demo 3] Created: {output} ({len(packets)} packets)")
    return output


if __name__ == "__main__":
    generate_demo_1_port_scan()
    generate_demo_2_web_traffic()
    generate_demo_3_multi_threat()
    print("All 3 presentation PCAP samples generated successfully in sample_data/!")
