# PacketScope — Backend Architecture & Phase 1 Documentation

**PacketScope** is an educational, defensive cybersecurity network analysis platform built to process raw PCAP/PCAPNG network captures, decode protocol metadata, generate traffic analytics, detect suspicious patterns via transparent deterministic rules, and export structured intelligence.

---

## 1. System Requirements & Prerequisites

- **Python:** 3.10 or 3.11+
- **Wireshark / TShark:** Required for PyShark packet dissection.
- **SQLite:** 3.35+ (bundled with standard Python distribution)
- **Virtual Environment:** Recommended (`venv` or `conda`)

---

## 2. TShark Installation Guide

### Windows
1. Download Wireshark installer from [wireshark.org](https://www.wireshark.org/download.html) or run via `winget`:
   ```powershell
   winget install --id WiresharkFoundation.Wireshark -e
   ```
2. By default, TShark installs to `C:\Program Files\Wireshark\tshark.exe`.
3. Add `C:\Program Files\Wireshark` to system `PATH` or specify `TSHARK_PATH` in `.env`.

### Linux (Debian / Ubuntu)
```bash
sudo apt-get update
sudo apt-get install -y tshark
# Allow non-superusers to run Wireshark/TShark if desired
sudo dpkg-reconfigure wireshark-common
sudo usermod -a -G wireshark $USER
```

### macOS (Homebrew)
```bash
brew install wireshark
```

---

## 3. Local Backend Setup & Commands

### Virtual Environment & Dependencies
```bash
# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt
```

### Configuration
Copy `.env.example` to `.env` and adjust thresholds if necessary:
```bash
cp .env.example .env
```

### Running the API Server
```bash
# Run with uvicorn development server:
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive OpenAPI documentation will be accessible at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health Endpoint: `http://127.0.0.1:8000/api/v1/health`

### Generating Synthetic Test PCAP
```bash
python scripts/generate_sample_pcap.py sample_data/synthetic_sample.pcap
```

### Running Backend Automated Tests
```bash
pytest -v backend/tests
```

### Running Live Verification Script
```bash
python scripts/verify_phase1.py
```

---

## 4. API Specification & Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health, database status, and TShark availability |
| `POST` | `/api/v1/captures` | Multipart upload for `.pcap` and `.pcapng` capture files |
| `GET` | `/api/v1/captures` | Paginated listing of uploaded captures |
| `GET` | `/api/v1/captures/{id}` | Detailed capture metadata and risk assessment |
| `GET` | `/api/v1/captures/{id}/status` | Status polling (pending, processing, completed, failed) |
| `GET` | `/api/v1/captures/{id}/packets` | Filterable, paginated packet metadata table |
| `GET` | `/api/v1/captures/{id}/statistics` | Aggregated traffic metrics, distributions, top talkers |
| `GET` | `/api/v1/captures/{id}/alerts` | Rule-generated alerts with severity filtering |
| `GET` | `/api/v1/captures/{id}/exports/xml` | PCAP to structured XML download |
| `GET` | `/api/v1/captures/{id}/exports/sqlite` | PCAP to standalone SQLite database download |
| `GET` | `/api/v1/captures/{id}/exports/csv` | Packet metadata table export in CSV format |
| `GET` | `/api/v1/captures/{id}/exports/json` | JSON intelligence summary |

---

## 5. Database Schema & Architecture

The database uses SQLite with Foreign Key constraints enabled (`PRAGMA foreign_keys=ON`).

```
+-----------------------------------+        +-----------------------------------+
|             captures              | 1    * |              packets              |
+-----------------------------------+--------+-----------------------------------+
| id (UUID, PK)                     |        | id (UUID, PK)                     |
| filename, original_filename       |        | capture_id (FK -> captures.id)    |
| file_size, file_hash_sha256       |        | packet_number, timestamp          |
| status (pending/completed/failed) |        | relative_time, source/dest MAC    |
| packet_count, duration_seconds    |        | source/dest IP, ip_version        |
| risk_score (0-100), risk_level    |        | transport_protocol, ports         |
| created_at, processed_at          |        | packet_length, tcp_flags          |
+-----------------+-----------------+        | dns_query_name, http_method/host  |
                  | 1                        | icmp_type, summary_info           |
                  |                          +-----------------------------------+
                  | 1
+-----------------+-----------------+        +-----------------------------------+
|        capture_statistics         | 1    * |              alerts               |
+-----------------------------------+--------+-----------------------------------+
| id (UUID, PK)                     |        | id (UUID, PK)                     |
| capture_id (FK -> captures.id, UQ)|        | capture_id (FK -> captures.id)    |
| total_packets, total_bytes        |        | rule_id, title, severity          |
| duration_seconds, avg_packet_size |        | explanation, evidence (JSON)      |
| packets_per_second                |        | source_ip, dest_ip, ports         |
| unique_src_ips, unique_dst_ips    |        | first_seen, last_seen, event_count|
| protocol_distribution (JSON)      |        | recommendation, disclaimer        |
| port_distribution (JSON)          |        +-----------------------------------+
| top_talkers, top_conversations    |
| time_series (JSON)                |
+-----------------------------------+
```

---

## 6. Deterministic Detection Rules & Thresholds

| Rule ID | Name | Severity | Default Threshold | Description |
|---|---|---|---|---|
| `RULE_PORT_SCAN` | Possible Port Scan | HIGH | $\ge$ 15 ports in 10s | Single source contacting distinct destination ports on a target host within a sliding window. |
| `RULE_CONNECTION_BURST` | Connection Burst | MEDIUM | $\ge$ 50 connections in 5s | Unusually rapid rate of outbound session handshakes or UDP bursts. |
| `RULE_REPEATED_TCP_SYN` | Repeated TCP SYN Activity | HIGH | $\ge$ 20 SYNs, ratio $\ge$ 3:1 | High ratio of SYN packets compared to completed/terminated handshakes (SYN flood pattern). |
| `RULE_SUSPICIOUS_PORT_ACTIVITY` | Suspicious / Monitored Ports | HIGH | Port in {21, 23, 69, 4444, 1337, 31337, 6667, 5555} | Traffic traversing legacy unencrypted administrative ports or known exploitation ports. |
| `RULE_ICMP_FLOOD` | ICMP Flood Indicator | MEDIUM | $\ge$ 30 ICMP packets in 5s | Excessive volume of ICMP echo requests indicating a ping sweep or degradation attack. |
| `RULE_LARGE_DNS_QUERY` | Large DNS Query | HIGH | Query length $\ge$ 60 chars | Abnormally long query labels suggestive of DNS covert tunneling or encoded exfiltration. |
| `RULE_UNENCRYPTED_PROTOCOL` | Unencrypted Protocol | LOW | HTTP, Telnet, or FTP detected | Detection of cleartext application traffic transmitting unencrypted headers and credentials. |
| `RULE_TRAFFIC_CONCENTRATION` | Single-Source Traffic Share | LOW | $\ge$ 60% of total capture | Single IP address accounting for dominant fraction of overall packet capture volume. |

### Heuristic Risk Scoring
- **Weights:** CRITICAL: 35 pts | HIGH: 20 pts | MEDIUM: 10 pts | LOW: 5 pts
- **Risk Level:** NONE (0), LOW (1-29), MEDIUM (30-59), HIGH (60-84), CRITICAL (85-100)
- **Notice:** This risk score is a deterministic heuristic score for educational triage and prioritization, not a probabilistic measure of host compromise.

---

## 7. Limitations & Ethical Statement

- **Defensive and Educational Scope Only:** PacketScope is designed strictly for authorized defensive inspection of user-provided PCAP files. It does not perform active scanning, packet injection, credential harvesting, or unauthorized network interception.
- **Payload Privacy:** Raw packet payloads are never stored in the database or exposed through API endpoints, ensuring user credentials and private payload contents remain protected.
- **Capture File Limits:** By default, uploads are capped at 50 MB to prevent resource exhaustion.
