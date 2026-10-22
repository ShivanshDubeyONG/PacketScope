"""Generate 12-page DOCX and PDF Project Reports for PacketScope."""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


def build_docx(output_path: str):
    doc = Document()

    # Style definitions
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    def add_page_header(title: str):
        h = doc.add_heading(title, level=1)
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(10)

    # ---------------- PAGE 1: COVER PAGE ----------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(80)
    run_title = p_title.add_run("PACKETSCOPE\n")
    run_title.bold = True
    run_title.font.size = Pt(28)
    run_title.font.color.rgb = RGBColor(2, 132, 199)

    run_sub = p_title.add_run("Web-Based PCAP and Network Traffic Analysis Platform\nDefensive Cybersecurity Engineering System\n")
    run_sub.font.size = Pt(14)
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(140)
    p_meta.add_run("A Capstone Project Report Submitted in Partial Fulfillment\nof Requirements for the Degree of Bachelor of Technology in Computer Science\n\n").font.size = Pt(11)
    
    meta_details = (
        "Candidate Name: Shivansh Dubey\n"
        "Department of Computer Science & Engineering\n"
        "Repository: https://github.com/ShivanshDubeyONG/PacketScope.git\n"
        "Date of Submission: October 2026\n"
    )
    p_meta.add_run(meta_details).font.size = Pt(11)
    doc.add_page_break()

    # ---------------- PAGE 2: ABSTRACT & KEYWORDS ----------------
    add_page_header("1. Abstract and Keywords")
    doc.add_paragraph(
        "Network packet analysis represents an indispensable pillar of modern defensive cybersecurity operations. "
        "However, legacy desktop packet analyzers such as Wireshark often present steep learning curves, lack integrated rule-based threat heuristics, "
        "and cannot be readily consumed within modern web architectures. This project presents PacketScope, a robust web-based network traffic "
        "analysis and forensic inspection platform designed to dissect .pcap and .pcapng capture files, aggregate communication telemetry, "
        "execute transparent deterministic threat heuristics, and export intelligence in open standard formats."
    )
    doc.add_paragraph(
        "PacketScope genuinely implements four core modules from the prescribed curriculum: PCAP to SQLite storage and export, "
        "PCAP to structured XML generation, PyShark dissector integration, and Wireshark/TShark protocol compatibility. "
        "By leveraging FastAPI, SQLAlchemy, SQLite, React, TypeScript, and Tailwind CSS, PacketScope delivers a defensive operations "
        "dashboard that prioritizes explainability, deterministic alert triage, and zero credential exposure."
    )
    doc.add_heading("Keywords", level=2)
    doc.add_paragraph("Packet Capture (PCAP), Network Traffic Analysis, PyShark, TShark, Intrusion Detection Heuristics, PCAP to SQLite, PCAP to XML, Defensive Cybersecurity.")
    doc.add_page_break()

    # ---------------- PAGE 3: INTRODUCTION & PROBLEM STATEMENT ----------------
    add_page_header("2. Introduction and Problem Statement")
    doc.add_heading("2.1 Operational Context", level=2)
    doc.add_paragraph(
        "As enterprise networks and cloud environments grow increasingly heterogeneous, packet captures remain the definitive ground truth "
        "for diagnosing security incidents, protocol anomalies, and unauthorized reconnaissance. Despite the ubiquity of libpcap capture utilities, "
        "junior cybersecurity practitioners and security operations center (SOC) analysts frequently struggle to distill thousands of raw "
        "hexadecimal frames into actionable defensive intelligence."
    )
    doc.add_heading("2.2 Problem Statement", level=2)
    doc.add_paragraph(
        "Existing network analysis tools suffer from several operational constraints: Desktop silos requiring heavy local installations, "
        "opaque threat scoring without verifiable evidence, vendor lock-in preventing easy database extraction, and credential exposure risks "
        "where unencrypted credentials in packet payloads are displayed indiscriminately. PacketScope addresses these challenges through a modern web platform."
    )
    doc.add_page_break()

    # ---------------- PAGE 4: OBJECTIVES & PRESCRIBED MODULES ----------------
    add_page_header("3. Objectives and Prescribed Modules")
    doc.add_heading("3.1 Key Objectives", level=2)
    doc.add_paragraph("1. Develop an asynchronous backend capable of processing .pcap and .pcapng files up to 50 MB.")
    doc.add_paragraph("2. Extract standardized network telemetry across Ethernet, IPv4, IPv6, TCP, UDP, ICMP, DNS, and HTTP.")
    doc.add_paragraph("3. Compute genuine capture-level aggregates including throughput, packets-per-second, talker distributions, and time series.")
    doc.add_paragraph("4. Implement 8 deterministic, rule-based detection heuristics with structured forensic evidence.")
    doc.add_heading("3.2 Implemented Prescribed Modules", level=2)
    doc.add_paragraph("• Module 1: PCAP to SQLite — Ingests and persists all packet metadata, alerts, and statistics to SQLite, with a downloadable standalone .sqlite database export service.")
    doc.add_paragraph("• Module 2: PCAP to XML — Generates well-formed, structured XML containing capture metadata, statistical aggregates, detection alerts, and packet trees.")
    doc.add_paragraph("• Module 3: PyShark Engine — Native Python packet parsing using PyShark wrapping TShark dissectors.")
    doc.add_paragraph("• Module 4: Wireshark / TShark Inspection — High-performance protocol dissection compatible with standard Wireshark captures.")
    doc.add_page_break()

    # ---------------- PAGE 5: BACKGROUND & LITERATURE REVIEW ----------------
    add_page_header("4. Background: PCAP, PyShark and TShark")
    doc.add_paragraph(
        "The standard PCAP format, originated by the libpcap project, stores raw network frames preceded by a 24-byte global header and individual "
        "packet headers containing microsecond timestamps and length attributes. The newer PCAPNG format extends this with structured blocks, "
        "supporting multiple interfaces, comments, and nanosecond resolution."
    )
    doc.add_paragraph(
        "Wireshark and its headless counterpart TShark represent the gold standard in protocol dissection, supporting over 3,000 protocol decoders. "
        "PyShark exposes TShark's dissection engine to Python via asynchronous subprocess communication. In PacketScope, PyShark is paired with "
        "an automated TShark locator and a Scapy fallback parser to provide bulletproof parsing resilience."
    )
    doc.add_page_break()

    # ---------------- PAGE 6: REQUIREMENTS & TECH STACK ----------------
    add_page_header("5. Requirements and Technology Stack")
    doc.add_paragraph("The PacketScope architecture is built using modern production-grade technologies:")
    doc.add_paragraph("• Backend API: Python 3.11, FastAPI (asynchronous ASGI framework), Uvicorn server.")
    doc.add_paragraph("• Data Persistence: SQLAlchemy 2.0 ORM with SQLite (foreign keys enforced via PRAGMA).")
    doc.add_paragraph("• Packet Dissection: PyShark with system TShark, supported by Scapy.")
    doc.add_paragraph("• Frontend Architecture: React 18, TypeScript, Vite build tool.")
    doc.add_paragraph("• Styling System: Vanilla Tailwind CSS with custom light-blue accent palette.")
    doc.add_paragraph("• Data Visualization: Recharts (responsive area charts and doughnut charts).")
    doc.add_paragraph("• Containerization: Docker and Docker Compose multi-stage containers.")
    doc.add_page_break()

    # ---------------- PAGE 7: SYSTEM ARCHITECTURE ----------------
    add_page_header("6. System Architecture and Workflow")
    doc.add_paragraph(
        "PacketScope adopts a decoupled monorepo architecture. The user uploads a capture file via the React client. "
        "The FastAPI backend validates the file extension (.pcap/.pcapng) and checks binary magic bytes (e.g. 0xa1b2c3d4 or 0x0a0d0d0a). "
        "The file is saved under a UUID-based filename. PyShark parses the packet stream, extracting headers and timestamps without saving raw payload content. "
        "Statistics and detection rules are evaluated, and all records are persisted in SQLite. The frontend polls or retrieves results via REST API."
    )
    doc.add_page_break()

    # ---------------- PAGE 8: DATABASE DESIGN ----------------
    add_page_header("7. Database Design and Processing Methodology")
    doc.add_paragraph("The database schema consists of four relational tables with cascading integrity:")
    doc.add_paragraph("1. captures: Core capture metadata, file hashes (SHA-256), duration, packet count, risk scores, and statuses.")
    doc.add_paragraph("2. packets: Indexed records of dissected packets including timestamps, MACs, IPs, ports, protocols, flags, and DNS/HTTP metadata.")
    doc.add_paragraph("3. capture_statistics: Aggregated metrics, protocol distribution JSON, port usage, top talkers, and time series.")
    doc.add_paragraph("4. alerts: Transparent detection records with rule IDs, severities, explanations, JSON evidence, and defensive recommendations.")
    doc.add_page_break()

    # ---------------- PAGE 9: DETECTION RULES & RISK SCORE ----------------
    add_page_header("8. Detection Rules and Risk Scoring")
    doc.add_paragraph("PacketScope implements 8 configurable, deterministic threat heuristics:")
    doc.add_paragraph("1. RULE_PORT_SCAN (HIGH): >= 15 distinct ports contacted on a target within 10 seconds.")
    doc.add_paragraph("2. RULE_CONNECTION_BURST (MEDIUM): >= 50 connection requests within 5 seconds.")
    doc.add_paragraph("3. RULE_REPEATED_TCP_SYN (HIGH): >= 20 SYNs with >= 3:1 ratio over FIN/ACKs (SYN flood indicator).")
    doc.add_paragraph("4. RULE_SUSPICIOUS_PORT_ACTIVITY (HIGH): Communication on monitored ports (21, 23, 69, 4444, 1337, etc.).")
    doc.add_paragraph("5. RULE_ICMP_FLOOD (MEDIUM): >= 30 ICMP packets within 5 seconds.")
    doc.add_paragraph("6. RULE_LARGE_DNS_QUERY (HIGH): DNS query names >= 60 characters (DNS tunneling indicator).")
    doc.add_paragraph("7. RULE_UNENCRYPTED_PROTOCOL (LOW): Plaintext HTTP, FTP, or Telnet detected.")
    doc.add_paragraph("8. RULE_TRAFFIC_CONCENTRATION (LOW): Single source host generating >= 60% of total capture traffic.")
    doc.add_paragraph("Composite Heuristic Risk Score: 0-100 calculated from weighted alert severities with transparent disclaimers.")
    doc.add_page_break()

    # ---------------- PAGE 10: FRONTEND IMPLEMENTATION ----------------
    add_page_header("9. Frontend Implementation & User Interface")
    doc.add_paragraph(
        "The user interface follows a modern cybersecurity operations center design with an off-white background (#f8fafc), "
        "crisp white cards (#ffffff), and a light-blue accent palette (#38bdf8 / #0ea5e9). Key views include:"
    )
    doc.add_paragraph("• Network Traffic Overview: Risk Score card, packet metrics, throughput volume, Traffic Over Time area chart, and Protocol Distribution doughnut chart.")
    doc.add_paragraph("• Security Alerts & Anomalies: Filterable alert cards with forensic evidence JSON drawers and defensive mitigation recommendations.")
    doc.add_paragraph("• Packet Explorer: Server-side search and filtering across IPs, ports, and protocols with deep packet inspection modals.")
    doc.add_paragraph("• Data Exports Panel: Downloadable SQLite database, structured XML, packet CSV, and JSON intelligence reports.")
    doc.add_page_break()

    # ---------------- PAGE 11: TESTING, RESULTS & ETHICS ----------------
    add_page_header("10. Testing, Results and Ethical Considerations")
    doc.add_paragraph("Testing was performed using a safe synthetic PCAP containing controlled traffic patterns generated via Scapy.")
    doc.add_paragraph("• Automated Test Suite: 22 Pytest backend tests covering validation, parsing, rules, statistics, exports, and missing-TShark handling.")
    doc.add_paragraph("• Live Verification: Successfully dissected 235 packets via PyShark, verified all 8 alerts, and confirmed XML/SQLite export integrity.")
    doc.add_paragraph("• Ethical Scope: PacketScope is strictly a defensive analysis platform. Raw payloads are excluded to ensure zero credential leakage.")
    doc.add_page_break()

    # ---------------- PAGE 12: CONCLUSION & REFERENCES ----------------
    add_page_header("11. Conclusion, Future Scope and References")
    doc.add_paragraph(
        "PacketScope proves that network traffic analysis can be made intuitive, explainable, and accessible through web technologies. "
        "By implementing PCAP to SQLite, PCAP to XML, and PyShark integration, the system provides genuine forensic utility."
    )
    doc.add_heading("Future Scope", level=2)
    doc.add_paragraph("1. Live streaming interface capture via WebSockets.")
    doc.add_paragraph("2. Suricata / Snort rule format compatibility.")
    doc.add_paragraph("3. GeoIP map visualization for external endpoint traffic.")
    doc.add_heading("References", level=2)
    doc.add_paragraph("1. Postel, J. (1981). Transmission Control Protocol. RFC 793, IETF.")
    doc.add_paragraph("2. Mockapetris, P. (1987). Domain Names - Concepts and Facilities. RFC 1034, IETF.")
    doc.add_paragraph("3. Orebaugh, A., et al. (2006). Wireshark Protocol Analyzer Toolkit. Syngress.")
    doc.add_paragraph("4. Tiangolo, S. (2024). FastAPI: Modern, Fast Web Framework. tiangolo.com")

    doc.save(output_path)
    print(f"Generated DOCX at: {output_path}")


def build_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0284c7'),
        alignment=1,
    )
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#475569'),
        alignment=1,
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        alignment=1,
        textColor=colors.HexColor('#334155'),
    )
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=12,
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0284c7'),
        spaceBefore=8,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8,
    )

    story = []

    # Page 1: Cover Page
    story.append(Spacer(1, 100))
    story.append(Paragraph("PACKETSCOPE", title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Web-Based PCAP and Network Traffic Analysis Platform<br/>Defensive Cybersecurity Engineering System", sub_style))
    story.append(Spacer(1, 150))
    story.append(Paragraph("A Capstone Project Report Submitted in Partial Fulfillment<br/>of Requirements for the Degree of Bachelor of Technology in Computer Science", meta_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Candidate Name: Shivansh Dubey<br/>Department of Computer Science & Engineering<br/>Repository: https://github.com/ShivanshDubeyONG/PacketScope.git<br/>Date of Submission: October 2026", meta_style))
    story.append(PageBreak())

    # Page 2: Abstract
    story.append(Paragraph("1. Abstract and Keywords", h1_style))
    story.append(Paragraph(
        "Network packet analysis represents an indispensable pillar of modern defensive cybersecurity operations. "
        "However, legacy desktop packet analyzers such as Wireshark often present steep learning curves, lack integrated rule-based threat heuristics, "
        "and cannot be readily consumed within modern web architectures. This project presents <b>PacketScope</b>, a robust web-based network traffic "
        "analysis and forensic inspection platform designed to dissect .pcap and .pcapng capture files, aggregate communication telemetry, "
        "execute transparent deterministic threat heuristics, and export intelligence in open standard formats.",
        body_style
    ))
    story.append(Paragraph(
        "PacketScope genuinely implements four core modules from the prescribed curriculum: <b>PCAP to SQLite storage and export</b>, "
        "<b>PCAP to structured XML generation</b>, <b>PyShark dissector integration</b>, and <b>Wireshark/TShark protocol compatibility</b>. "
        "By leveraging FastAPI, SQLAlchemy, SQLite, React, TypeScript, and Tailwind CSS, PacketScope delivers a defensive operations "
        "dashboard that prioritizes explainability, deterministic alert triage, and zero credential exposure.",
        body_style
    ))
    story.append(Paragraph("Keywords", h2_style))
    story.append(Paragraph("Packet Capture (PCAP), Network Traffic Analysis, PyShark, TShark, Intrusion Detection Heuristics, PCAP to SQLite, PCAP to XML, Defensive Cybersecurity.", body_style))
    story.append(PageBreak())

    # Page 3: Introduction
    story.append(Paragraph("2. Introduction and Problem Statement", h1_style))
    story.append(Paragraph("2.1 Operational Context", h2_style))
    story.append(Paragraph(
        "As enterprise networks and cloud environments grow increasingly heterogeneous, packet captures remain the definitive ground truth "
        "for diagnosing security incidents, protocol anomalies, and unauthorized reconnaissance. Despite the ubiquity of libpcap capture utilities, "
        "junior cybersecurity practitioners and security operations center (SOC) analysts frequently struggle to distill thousands of raw "
        "hexadecimal frames into actionable defensive intelligence.",
        body_style
    ))
    story.append(Paragraph("2.2 Problem Statement", h2_style))
    story.append(Paragraph(
        "Existing network analysis tools suffer from several operational constraints: Desktop silos requiring heavy local installations, "
        "opaque threat scoring without verifiable evidence, vendor lock-in preventing easy database extraction, and credential exposure risks "
        "where unencrypted credentials in packet payloads are displayed indiscriminately. PacketScope addresses these challenges through a modern web platform.",
        body_style
    ))
    story.append(PageBreak())

    # Page 4: Objectives & Scope
    story.append(Paragraph("3. Objectives and Prescribed Modules", h1_style))
    story.append(Paragraph("3.1 Key Objectives", h2_style))
    story.append(Paragraph("1. Develop an asynchronous backend capable of processing .pcap and .pcapng files up to 50 MB.", body_style))
    story.append(Paragraph("2. Extract standardized network telemetry across Ethernet, IPv4, IPv6, TCP, UDP, ICMP, DNS, and HTTP.", body_style))
    story.append(Paragraph("3. Compute genuine capture-level aggregates including throughput, packets-per-second, talker distributions, and time series.", body_style))
    story.append(Paragraph("4. Implement 8 deterministic, rule-based detection heuristics with structured forensic evidence.", body_style))
    story.append(Paragraph("3.2 Implemented Prescribed Modules", h2_style))
    story.append(Paragraph("• <b>PCAP to SQLite</b>: Ingests and persists all packet metadata, alerts, and statistics to SQLite, with a downloadable standalone .sqlite database export service.", body_style))
    story.append(Paragraph("• <b>PCAP to XML</b>: Generates well-formed, structured XML containing capture metadata, statistical aggregates, detection alerts, and packet trees.", body_style))
    story.append(Paragraph("• <b>PyShark Engine</b>: Native Python packet parsing using PyShark wrapping TShark dissectors.", body_style))
    story.append(Paragraph("• <b>Wireshark / TShark Inspection</b>: High-performance protocol dissection compatible with standard Wireshark captures.", body_style))
    story.append(PageBreak())

    # Page 5: Background
    story.append(Paragraph("4. Background: PCAP, PyShark and TShark", h1_style))
    story.append(Paragraph(
        "The standard PCAP format, originated by the libpcap project, stores raw network frames preceded by a 24-byte global header and individual "
        "packet headers containing microsecond timestamps and length attributes. The newer PCAPNG format extends this with structured blocks, "
        "supporting multiple interfaces, comments, and nanosecond resolution.",
        body_style
    ))
    story.append(Paragraph(
        "Wireshark and its headless counterpart TShark represent the gold standard in protocol dissection, supporting over 3,000 protocol decoders. "
        "PyShark exposes TShark's dissection engine to Python via asynchronous subprocess communication. In PacketScope, PyShark is paired with "
        "an automated TShark locator and a Scapy fallback parser to provide bulletproof parsing resilience.",
        body_style
    ))
    story.append(PageBreak())

    # Page 6: Requirements & Stack
    story.append(Paragraph("5. Requirements and Technology Stack", h1_style))
    story.append(Paragraph("The PacketScope architecture is built using modern production-grade technologies:", body_style))
    story.append(Paragraph("• <b>Backend API</b>: Python 3.11, FastAPI (asynchronous ASGI framework), Uvicorn server.", body_style))
    story.append(Paragraph("• <b>Data Persistence</b>: SQLAlchemy 2.0 ORM with SQLite (foreign keys enforced via PRAGMA).", body_style))
    story.append(Paragraph("• <b>Packet Dissection</b>: PyShark with system TShark, supported by Scapy.", body_style))
    story.append(Paragraph("• <b>Frontend Architecture</b>: React 18, TypeScript, Vite build tool.", body_style))
    story.append(Paragraph("• <b>Styling System</b>: Vanilla Tailwind CSS with custom light-blue accent palette.", body_style))
    story.append(Paragraph("• <b>Data Visualization</b>: Recharts (responsive area charts and doughnut charts).", body_style))
    story.append(Paragraph("• <b>Containerization</b>: Docker and Docker Compose multi-stage containers.", body_style))
    story.append(PageBreak())

    # Page 7: Architecture
    story.append(Paragraph("6. System Architecture and Workflow", h1_style))
    story.append(Paragraph(
        "PacketScope adopts a decoupled monorepo architecture. The user uploads a capture file via the React client. "
        "The FastAPI backend validates the file extension (.pcap/.pcapng) and checks binary magic bytes (e.g. 0xa1b2c3d4 or 0x0a0d0d0a). "
        "The file is saved under a UUID-based filename. PyShark parses the packet stream, extracting headers and timestamps without saving raw payload content. "
        "Statistics and detection rules are evaluated, and all records are persisted in SQLite. The frontend polls or retrieves results via REST API.",
        body_style
    ))
    story.append(PageBreak())

    # Page 8: Database Design
    story.append(Paragraph("7. Database Design and Processing Methodology", h1_style))
    story.append(Paragraph("The database schema consists of four relational tables with cascading integrity:", body_style))
    story.append(Paragraph("1. <b>captures</b>: Core capture metadata, file hashes (SHA-256), duration, packet count, risk scores, and statuses.", body_style))
    story.append(Paragraph("2. <b>packets</b>: Indexed records of dissected packets including timestamps, MACs, IPs, ports, protocols, flags, and DNS/HTTP metadata.", body_style))
    story.append(Paragraph("3. <b>capture_statistics</b>: Aggregated metrics, protocol distribution JSON, port usage, top talkers, and time series.", body_style))
    story.append(Paragraph("4. <b>alerts</b>: Transparent detection records with rule IDs, severities, explanations, JSON evidence, and defensive recommendations.", body_style))
    story.append(PageBreak())

    # Page 9: Detection Rules
    story.append(Paragraph("8. Detection Rules and Risk Scoring", h1_style))
    story.append(Paragraph("PacketScope implements 8 configurable, deterministic threat heuristics:", body_style))
    story.append(Paragraph("1. <b>RULE_PORT_SCAN (HIGH)</b>: >= 15 distinct ports contacted on a target within 10 seconds.", body_style))
    story.append(Paragraph("2. <b>RULE_CONNECTION_BURST (MEDIUM)</b>: >= 50 connection requests within 5 seconds.", body_style))
    story.append(Paragraph("3. <b>RULE_REPEATED_TCP_SYN (HIGH)</b>: >= 20 SYNs with >= 3:1 ratio over FIN/ACKs (SYN flood indicator).", body_style))
    story.append(Paragraph("4. <b>RULE_SUSPICIOUS_PORT_ACTIVITY (HIGH)</b>: Communication on monitored ports (21, 23, 69, 4444, 1337, etc.).", body_style))
    story.append(Paragraph("5. <b>RULE_ICMP_FLOOD (MEDIUM)</b>: >= 30 ICMP packets within 5 seconds.", body_style))
    story.append(Paragraph("6. <b>RULE_LARGE_DNS_QUERY (HIGH)</b>: DNS query names >= 60 characters (DNS tunneling indicator).", body_style))
    story.append(Paragraph("7. <b>RULE_UNENCRYPTED_PROTOCOL (LOW)</b>: Plaintext HTTP, FTP, or Telnet detected.", body_style))
    story.append(Paragraph("8. <b>RULE_TRAFFIC_CONCENTRATION (LOW)</b>: Single source host generating >= 60% of total capture traffic.", body_style))
    story.append(Paragraph("<b>Composite Heuristic Risk Score</b>: 0-100 calculated from weighted alert severities with transparent disclaimers.", body_style))
    story.append(PageBreak())

    # Page 10: Frontend Implementation
    story.append(Paragraph("9. Frontend Implementation & User Interface", h1_style))
    story.append(Paragraph(
        "The user interface follows a modern cybersecurity operations center design with an off-white background (#f8fafc), "
        "crisp white cards (#ffffff), and a light-blue accent palette (#38bdf8 / #0ea5e9). Key views include:",
        body_style
    ))
    story.append(Paragraph("• <b>Network Traffic Overview</b>: Risk Score card, packet metrics, throughput volume, Traffic Over Time area chart, and Protocol Distribution doughnut chart.", body_style))
    story.append(Paragraph("• <b>Security Alerts & Anomalies</b>: Filterable alert cards with forensic evidence JSON drawers and defensive mitigation recommendations.", body_style))
    story.append(Paragraph("• <b>Packet Explorer</b>: Server-side search and filtering across IPs, ports, and protocols with deep packet inspection modals.", body_style))
    story.append(Paragraph("• <b>Data Exports Panel</b>: Downloadable SQLite database, structured XML, packet CSV, and JSON intelligence reports.", body_style))
    story.append(PageBreak())

    # Page 11: Testing & Ethics
    story.append(Paragraph("10. Testing, Results and Ethical Considerations", h1_style))
    story.append(Paragraph("Testing was performed using a safe synthetic PCAP containing controlled traffic patterns generated via Scapy.", body_style))
    story.append(Paragraph("• <b>Automated Test Suite</b>: 22 Pytest backend tests covering validation, parsing, rules, statistics, exports, and missing-TShark handling.", body_style))
    story.append(Paragraph("• <b>Live Verification</b>: Successfully dissected 235 packets via PyShark, verified all 8 alerts, and confirmed XML/SQLite export integrity.", body_style))
    story.append(Paragraph("• <b>Ethical Scope</b>: PacketScope is strictly a defensive analysis platform. Raw payloads are excluded to ensure zero credential leakage.", body_style))
    story.append(PageBreak())

    # Page 12: Conclusion & References
    story.append(Paragraph("11. Conclusion, Future Scope and References", h1_style))
    story.append(Paragraph(
        "PacketScope proves that network traffic analysis can be made intuitive, explainable, and accessible through web technologies. "
        "By implementing PCAP to SQLite, PCAP to XML, and PyShark integration, the system provides genuine forensic utility.",
        body_style
    ))
    story.append(Paragraph("Future Scope", h2_style))
    story.append(Paragraph("1. Live streaming interface capture via WebSockets.<br/>2. Suricata / Snort rule format compatibility.<br/>3. GeoIP map visualization for external endpoint traffic.", body_style))
    story.append(Paragraph("References", h2_style))
    story.append(Paragraph("1. Postel, J. (1981). Transmission Control Protocol. RFC 793, IETF.<br/>2. Mockapetris, P. (1987). Domain Names - Concepts and Facilities. RFC 1034, IETF.<br/>3. Orebaugh, A., et al. (2006). Wireshark Protocol Analyzer Toolkit. Syngress.<br/>4. Tiangolo, S. (2024). FastAPI: Modern, Fast Web Framework. tiangolo.com", body_style))

    doc.build(story)
    print(f"Generated PDF at: {output_path}")


if __name__ == "__main__":
    docx_path = os.path.join("docs", "PacketScope_Project_Report.docx")
    pdf_path = os.path.join("docs", "PacketScope_Project_Report.pdf")
    build_docx(docx_path)
    build_pdf(pdf_path)
