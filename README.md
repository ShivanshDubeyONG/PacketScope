# PacketScope — Web-Based PCAP and Network Traffic Analysis Platform

> **Defensive Cybersecurity Platform for PCAP Dissection, Network Intelligence, and Heuristic Threat Detection**

PacketScope is a web application that allows users to upload authorized `.pcap` or `.pcapng` network-capture files, extract protocol metadata using PyShark and TShark, explore network communication, detect suspicious traffic patterns using transparent deterministic rules, and export intelligence in XML, SQLite, CSV, and JSON formats.

---

## Live Localhost Links

When the development servers are running:
- **Web Application Dashboard:** [http://localhost:5173/](http://localhost:5173/)
- **FastAPI Interactive API Documentation (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **FastAPI Alternative Documentation (ReDoc):** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Endpoint:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## Implemented Prescribed Modules

1. **PCAP Analysis**
   - **PCAP to SQLite**: Automatically parses and saves packet streams and metadata to SQLite, with an export service producing standalone SQLite databases (`/api/v1/captures/{id}/exports/sqlite`).
   - **PCAP to XML**: Generates well-formed, structured XML containing capture metadata, statistical aggregates, alerts, and packet trees (`/api/v1/captures/{id}/exports/xml`).
2. **Traffic Analysis**
   - **PyShark Engine**: Native integration with PyShark and TShark for full dissector analysis.
   - **Wireshark/TShark Compatibility**: Inspects Ethernet, IPv4, IPv6, TCP, UDP, ICMP, DNS, and HTTP traffic with graceful missing-TShark handling.

---

## Project Structure

```text
packetscope/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Endpoints: health, captures, exports
│   │   ├── core/           # Config, database, logging, exceptions
│   │   ├── models/         # SQLAlchemy models (Capture, Packet, Alert, Statistics)
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Parser, stats calculator, detection engine, exporters
│   │   └── main.py         # FastAPI application entry point
│   ├── tests/              # 22 comprehensive Pytest test cases
│   ├── requirements.txt
│   └── Dockerfile          # Backend container with non-interactive TShark
├── frontend/
│   ├── src/
│   │   ├── components/     # Overview, alerts, packets, history, exports, layout
│   │   ├── services/       # Type-safe API client
│   │   ├── types/          # TypeScript definitions
│   │   ├── App.tsx         # Main dashboard router & state
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js  # Clean theme with light-blue accents
│   ├── vite.config.ts
│   └── Dockerfile          # Frontend production container with Nginx
├── docs/
│   ├── PacketScope_Project_Report.pdf   # 12-page technical report
│   ├── PacketScope_Project_Report.docx  # DOCX format report
│   ├── PROJECT_REPORT_SOURCE.md         # Markdown report source
│   └── PHASE1_BACKEND.md                # Backend architecture reference
├── sample_data/
│   ├── synthetic_sample.pcap            # Safe synthetic test PCAP (235 packets)
│   └── verified_export.xml
├── scripts/
│   ├── generate_sample_pcap.py          # Synthetic generator with Scapy
│   ├── verify_phase1.py                 # Live verification script
│   └── build_report_files.py            # Report generator
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── PROGRESS.md
└── README.md
```

---

## Running the Application

### Option 1: Docker Compose (Recommended)
Ensure Docker and Docker Compose are installed, then run:
```bash
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API & Docs: `http://localhost:8000/docs`

### Option 2: Manual Local Development

#### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Wireshark / TShark installed ([wireshark.org](https://www.wireshark.org/download.html))

#### 2. Backend Setup
```powershell
# In root directory:
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# Run tests (22 tests)
pytest -v backend/tests

# Start backend server:
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 3. Frontend Setup
```powershell
# In a second terminal:
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 12-Page Project Report

The project documentation includes a comprehensive academic report formatted to 12 pages:
- **PDF Report:** [docs/PacketScope_Project_Report.pdf](file:///c:/Users/Shivansh/Desktop/PacketScope/docs/PacketScope_Project_Report.pdf) (Verified 12 pages)
- **DOCX Report:** [docs/PacketScope_Project_Report.docx](file:///c:/Users/Shivansh/Desktop/PacketScope/docs/PacketScope_Project_Report.docx)
- **Markdown Source:** [docs/PROJECT_REPORT_SOURCE.md](file:///c:/Users/Shivansh/Desktop/PacketScope/docs/PROJECT_REPORT_SOURCE.md)

---

## Detection Rules & Risk Scoring

PacketScope includes 8 configurable, deterministic detection rules:
1. **Possible Port Scan (`RULE_PORT_SCAN`)** — Distinct destination ports contacted on target.
2. **Connection Burst (`RULE_CONNECTION_BURST`)** — High connection initiation rate.
3. **Repeated TCP SYN Activity (`RULE_REPEATED_TCP_SYN`)** — SYN flood and half-open scanning.
4. **Suspicious / Monitored Port Activity (`RULE_SUSPICIOUS_PORT_ACTIVITY`)** — Monitored service ports (4444, 1337, 21, 23, etc.).
5. **ICMP Flood Indicator (`RULE_ICMP_FLOOD`)** — Excessive ICMP rates.
6. **Large DNS Query Indicator (`RULE_LARGE_DNS_QUERY`)** — DNS query lengths $\ge$ 60 chars (DNS tunneling).
7. **Unencrypted Application Protocol (`RULE_UNENCRYPTED_PROTOCOL`)** — Plaintext HTTP, FTP, Telnet.
8. **Single-Source Traffic Concentration (`RULE_TRAFFIC_CONCENTRATION`)** — Single source generating $\ge$ 60% of total volume.

---

## Defensive and Ethical Use Notice

PacketScope is developed solely for defensive security analysis, educational demonstration, and authorized network troubleshooting. The platform does not execute exploits, harvest credentials, or conduct unauthorized packet captures. Raw payload contents are never stored in databases or exposed over APIs.

---

## License

This project is licensed under the [MIT License](LICENSE).
