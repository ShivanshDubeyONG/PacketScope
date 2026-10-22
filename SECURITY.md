# Security Policy

## Supported Versions
Only the latest release on the `main` branch is actively supported with security updates.

## Reporting a Vulnerability
PacketScope is a defensive analysis utility designed to parse user-supplied packet captures in an isolated environment.

If you discover a security vulnerability (such as a buffer overflow, path traversal, or remote code execution in packet parsing):
1. **Do not create a public issue.**
2. Send a detailed vulnerability report privately to the repository maintainer.
3. Include the reproducible sample PCAP or proof of concept.

## Architectural Safeguards
- **Zero Raw Payload Storage:** PacketScope parses and extracts header fields only. It does not store application layer payloads to prevent accidental retention of sensitive corporate credentials.
- **Strict Magic Byte Validation:** Uploaded captures must exhibit valid PCAP or PCAPNG magic numbers.
- **UUID Filename Sanitization:** Uploaded files are stored under server-generated UUID identifiers to eliminate directory traversal risks.
