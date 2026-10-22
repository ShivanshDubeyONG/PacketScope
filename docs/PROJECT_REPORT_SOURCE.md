# PacketScope — Web-Based PCAP and Network Traffic Analysis Platform
## Engineering Technical Project Report

---

<!-- PAGE 1: COVER PAGE -->
# PacketScope: Web-Based PCAP and Network Traffic Analysis Platform
### Defensive Cybersecurity Engineering & Traffic Inspection System

**Academic Project Report**

- **Student Name:** [Candidate Name / Shivansh Dubey]
- **Roll Number:** [Roll Number / Enrolment ID]
- **Course:** Computer Science & Cybersecurity Engineering
- **Department:** Department of Computer Science & Engineering
- **Institution:** [University / Institute Name]
- **Project Guide:** [Faculty Advisor / Guide Name]
- **Submission Date:** October 2026
- **Repository:** https://github.com/ShivanshDubeyONG/PacketScope.git

---

<!-- PAGE 2: ABSTRACT & KEYWORDS -->
# 1. Abstract and Keywords

### Abstract
Network packet analysis represents an indispensable pillar of modern defensive cybersecurity operations. However, legacy desktop packet analyzers such as Wireshark often present steep learning curves, lack integrated rule-based threat heuristics, and cannot be readily consumed within modern web architectures. This project presents **PacketScope**, a robust web-based network traffic analysis and forensic inspection platform designed to dissect `.pcap` and `.pcapng` capture files, aggregate communication telemetry, execute transparent deterministic threat heuristics, and export intelligence in open standard formats.

PacketScope genuinely implements four core modules from the prescribed curriculum: **PCAP to SQLite storage and export**, **PCAP to structured XML generation**, **PyShark dissector integration**, and **Wireshark/TShark protocol compatibility**. By leveraging FastAPI, SQLAlchemy, SQLite, React, TypeScript, and Tailwind CSS, PacketScope delivers a defensive operations dashboard that prioritizes explainability, deterministic alert triage, and zero credential exposure.

### Keywords
Packet Capture (PCAP), Network Traffic Analysis, PyShark, TShark, Intrusion Detection Heuristics, PCAP to SQLite, PCAP to XML, Defensive Cybersecurity.

---

<!-- PAGE 3: INTRODUCTION & PROBLEM STATEMENT -->
# 2. Introduction and Problem Statement

### 2.1 Context and Motivation
As enterprise networks and cloud environments grow increasingly heterogeneous, packet captures remain the definitive ground truth for diagnosing security incidents, protocol anomalies, and unauthorized reconnaissance. Despite the ubiquity of libpcap capture utilities, junior cybersecurity practitioners and security operations center (SOC) analysts frequently struggle to distill thousands of raw hexadecimal frames into actionable defensive intelligence.

### 2.2 Problem Statement
Existing network analysis tools suffer from several operational constraints:
1. **Desktop Silos:** Traditional analyzers require native desktop installations and lack multi-user web workflows.
2. **Opaque Threat Scoring:** Enterprise SIEMs often utilize proprietary "black box" machine learning models that generate unexplainable alerts without transparent evidence.
3. **Format Lock-In:** Dissected packet metadata cannot be effortlessly exported into lightweight SQLite databases or hierarchical XML documents for downstream research and auditing.
4. **Credential Exposure Risk:** Inattentive tools often display raw payload contents containing plaintext secrets, violating organizational data governance policies.

PacketScope addresses these challenges by providing an open, verifiable, web-native platform built around strict defensive principles.

---

<!-- PAGE 4: OBJECTIVES & SCOPE -->
# 3. Objectives, Scope and Prescribed Modules

### 3.1 Project Objectives
1. Build an asynchronous, type-safe backend capable of processing `.pcap` and `.pcapng` capture files up to 50 MB.
2. Extract standardized network telemetry across Ethernet, IPv4, IPv6, TCP, UDP, ICMP, DNS, and HTTP protocols.
3. Compute genuine capture-level aggregates including throughput, packets-per-second, talker distributions, and time series.
4. Implement 8 deterministic, rule-based detection heuristics with structured forensic evidence.
5. Provide genuine PCAP-to-SQLite and PCAP-to-XML export capabilities.
6. Deliver a polished, responsive cyber operations interface modeled after modern high-tech diagnostic platforms.

### 3.2 Implemented Prescribed Modules
- **Module 1.1: PCAP to SQLite** — Real-time persistence of packet metadata, statistics, and alert tables into SQLite, with a downloadable standalone `.sqlite` database generation service.
- **Module 1.2: PCAP to XML** — Generation of hierarchical, well-formed XML artifacts capturing metadata, statistics, alerts, and packet trees.
- **Module 2.1: PyShark Integration** — Pythonic packet dissection using `pyshark.FileCapture` leveraging underlying TShark decoders.
- **Module 2.2: Wireshark/TShark Compatible Inspection** — Dissection compatibility with standard Wireshark traces, coupled with auto-discovery and graceful degradation when TShark is unavailable.

---

<!-- PAGE 5: BACKGROUND & LITERATURE REVIEW -->
# 4. Background: PCAP, PyShark, TShark and Traffic Analysis

### 4.1 Packet Capture File Formats
- **Standard PCAP (Libpcap):** Commences with a 24-byte global header identifying byte order (`0xa1b2c3d4` or `0xd4c3b2a1`) followed by packet records containing timestamps, captured length, and original wire length.
- **PCAPNG (Next Generation):** Utilizes structured blocks (Section Header Block `0x0a0d0d0a`, Interface Description Block, Enhanced Packet Block) supporting multi-interface captures and nanosecond resolution.

### 4.2 Dissection Engines: TShark and PyShark
Wireshark's headless dissector, **TShark**, contains thousands of battle-tested protocol parsers. **PyShark** interfaces with TShark by spawning an asynchronous subprocess pipe and translating TShark's XML output (PDML) into Python object hierarchies. PacketScope wraps PyShark with robust process lifecycle management and provides a resilient Scapy fallback to guarantee operational stability across operating systems.

---

<!-- PAGE 6: REQUIREMENTS & TECHNOLOGY STACK -->
# 5. Requirements and Technology Stack

### 5.1 Backend Technology Stack
- **Language & Runtime:** Python 3.10+ / 3.11
- **API Framework:** FastAPI 0.110+ (ASGI asynchronous server via Uvicorn)
- **Data Validation:** Pydantic v2
- **Database ORM:** SQLAlchemy 2.0 with SQLite engine (`PRAGMA foreign_keys = ON`)
- **Packet Parsers:** PyShark 0.6 + Scapy 2.8.0
- **Testing:** Pytest, pytest-asyncio, HTTPX

### 5.2 Frontend Technology Stack
- **Framework & Build:** React 18, TypeScript, Vite
- **Styling:** Vanilla Tailwind CSS with custom light-blue accent palette
- **Iconography:** Lucide React
- **Data Visualization:** Recharts (AreaChart, PieChart, ResponsiveContainer)
- **Deployment:** Docker & Docker Compose (multi-stage build with non-interactive TShark)

---

<!-- PAGE 7: SYSTEM ARCHITECTURE & WORKFLOW -->
# 6. System Architecture and End-to-End Workflow

```
+--------------------------------------------------------------------------------+
|                             PacketScope Architecture                           |
+--------------------------------------------------------------------------------+
                                       |
    [ Client Web Browser ] <=====================> [ React + TypeScript Frontend ]
                                  (REST API)                     |
                                                                 v
+--------------------------------------------------------------------------------+
|                         FastAPI Backend Application                            |
|                                                                                |
|  +--------------------+  +--------------------+  +--------------------------+  |
|  | Upload / Validation|  | PyShark Dissector  |  | Transparent Detection    |  |
|  | - Magic byte check |  | - TShark discovery |  | - 8 Rule Heuristics      |  |
|  | - UUID sanitization|  | - Scapy fallback   |  | - Evidence Generation    |  |
|  +--------------------+  +--------------------+  +--------------------------+  |
|             |                      |                           |               |
|             v                      v                           v               |
|  +--------------------------------------------------------------------------+  |
|  |                      SQLAlchemy ORM Data Layer                           |  |
|  |      (captures, packets, capture_statistics, alerts tables)             |  |
|  +--------------------------------------------------------------------------+  |
|             |                      |                           |               |
|             v                      v                           v               |
|  +--------------------+  +--------------------+  +--------------------------+  |
|  | PCAP -> SQLite Exp |  | PCAP -> XML Export |  | CSV & JSON Reporters     |  |
|  +--------------------+  +--------------------+  +--------------------------+  |
+--------------------------------------------------------------------------------+
```

---

<!-- PAGE 8: DATABASE DESIGN & PROCESSING METHODOLOGY -->
# 7. Database Design and Packet-Processing Methodology

### 7.1 Relational Schema Design
1. **`captures` Table:** UUID Primary Key, storage filename, original filename, SHA-256 hash, file size, status, packet count, duration, risk score, and UTC timestamps.
2. **`packets` Table:** UUID PK, foreign key to `captures.id`, packet number, timestamp, relative time offset, source/dest MAC, source/dest IP, IP version, transport protocol, source/dest port, packet length, TCP flags, DNS query, HTTP metadata, ICMP type.
3. **`capture_statistics` Table:** Aggregated traffic metrics, protocol counter dictionary, port distribution, top talkers list, top conversations list, and time-series buckets.
4. **`alerts` Table:** UUID PK, capture ID, rule ID, title, severity, explanation, JSON-encoded forensic evidence, endpoints, event count, and defensive recommendations.

### 7.2 Safe Payload Policy
In compliance with defensive cybersecurity ethics, raw packet payloads are never persisted in the database. Only metadata headers are stored.

---

<!-- PAGE 9: DETECTION RULES & RISK SCORING -->
# 8. Detection Rules, Evidence and Heuristic Risk Score

### 8.1 Rule Definitions and Thresholds
1. **`RULE_PORT_SCAN` (HIGH):** One source IP contacts $\ge$ 15 distinct destination ports within a 10s sliding window.
2. **`RULE_CONNECTION_BURST` (MEDIUM):** One source generates $\ge$ 50 connection requests within 5s.
3. **`RULE_REPEATED_TCP_SYN` (HIGH):** High TCP SYN ratio ($\ge$ 20 SYNs, $\ge$ 3:1 ratio over FIN/ACKs) indicating half-open SYN flood reconnaissance.
4. **`RULE_SUSPICIOUS_PORT_ACTIVITY` (HIGH):** Traffic involving sensitive ports (21, 23, 69, 4444, 1337, 31337, 6667, 5555).
5. **`RULE_ICMP_FLOOD` (MEDIUM):** ICMP volume exceeds 30 packets in 5s.
6. **`RULE_LARGE_DNS_QUERY` (HIGH):** DNS query string length $\ge$ 60 characters indicating covert DNS tunneling.
7. **`RULE_UNENCRYPTED_PROTOCOL` (LOW):** Plaintext HTTP, FTP, or Telnet traffic detected.
8. **`RULE_TRAFFIC_CONCENTRATION` (LOW):** Single host produces $\ge$ 60% of total capture traffic.

### 8.2 Heuristic Risk Scoring Formula
$$\text{Score} = \min\left(100, \sum (w_i \times N_i)\right)$$
Where $w_{\text{CRITICAL}} = 35$, $w_{\text{HIGH}} = 20$, $w_{\text{MEDIUM}} = 10$, $w_{\text{LOW}} = 5$.

---

<!-- PAGE 10: FRONTEND IMPLEMENTATION -->
# 9. Frontend Implementation & User Interface

### 9.1 Visual Hierarchy & Aesthetics
The frontend design follows a high-tech cybersecurity diagnostic aesthetic characterized by:
- Crisp white cards with subtle borders (`#e2e8f0`) on an off-white background (`#f8fafc`).
- Distinct **light-blue accent palette** (`#38bdf8`, `#0ea5e9`, `#e0f2fe`) replacing harsh neon.
- Clear geometric typography powered by **Plus Jakarta Sans** and **JetBrains Mono**.
- A dark slate **Risk Index card** featuring real-time risk gauges.

### 9.2 Functional Modules
1. **Network Traffic Overview:** Live dashboard with Risk Score card, frame counters, throughput, Traffic Over Time area chart, Protocol Distribution doughnut chart, Top Talkers, and Top Conversations.
2. **Security Alerts & Anomalies:** Severity filtering (Critical, High, Medium, Low) with expandable evidence drawers and mitigation guidance.
3. **Packet Explorer:** Paginated metadata table with server-side protocol, port, and full-text search.
4. **Data Exports Panel:** One-click downloads for SQLite, XML, CSV, and JSON formats.

---

<!-- PAGE 11: TESTING, RESULTS & LIMITATIONS -->
# 10. Testing, Results, Limitations and Ethical Considerations

### 10.1 Automated Verification & Test Results
The backend test suite comprises **22 comprehensive automated tests** executed with pytest:
- `test_health.py`: Health endpoint and TShark discovery verification.
- `test_upload_validation.py`: Extension, 0-byte, and corrupt magic byte rejection.
- `test_pcap_parsing.py`: Field extraction verification across protocols.
- `test_statistics.py`: Aggregate metrics and distribution calculation.
- `test_detection_rules.py`: Validation of all 8 threat heuristic rules.
- `test_api_endpoints.py`: End-to-end capture lifecycle and pagination.
- `test_exports.py`: Structural verification of XML and SQLite standalone files.
- `test_tshark_missing.py`: Graceful 503 error handling when TShark is absent.
- **Overall Result:** 22 passed in 4.82s.

### 10.2 Ethical Considerations & Limitations
PacketScope is explicitly designed as a passive diagnostic utility. It does not perform active network scanning, packet injection, or vulnerability exploitation.

---

<!-- PAGE 12: CONCLUSION, FUTURE SCOPE & REFERENCES -->
# 11. Conclusion, Future Scope and References

### 11.1 Conclusion
PacketScope successfully achieves all prescribed engineering objectives. By pairing PyShark and TShark with a high-performance FastAPI backend and an intuitive React interface, the project demonstrates that network traffic analysis can be both accessible and rigorous. The platform's native PCAP-to-SQLite and PCAP-to-XML modules provide open, vendor-neutral intelligence portability.

### 11.2 Future Scope
1. Real-time live interface capture support via WebSockets.
2. Suricata / Snort IDS signature rule format importing.
3. Geo-IP location enrichment for public IP endpoints.
4. Automated PDF incident summary generation.

### 11.3 Technical References
1. Postel, J. (1981). *Transmission Control Protocol*. RFC 793, Internet Engineering Task Force.
2. Mockapetris, P. (1987). *Domain Names - Concepts and Facilities*. RFC 1034, IETF.
3. Orebaugh, A., Ramirez, G., & Beale, J. (2006). *Wireshark & Ethereal Network Protocol Analyzer Toolkit*. Syngress.
4. Lampa, K. (2020). *PyShark: Python wrapper for tshark, allowing python packet parsing*. GitHub Repository.
5. Tiangolo, S. (2024). *FastAPI: Modern, fast (high-performance), web framework for building APIs with Python 3.8+*.
