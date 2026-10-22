# Contributing to PacketScope

Thank you for contributing to PacketScope!

## Development Guidelines
1. Fork the repository and create a feature branch (`git checkout -b feat/your-feature`).
2. Adhere to defensive security coding standards. Raw payloads must never be persisted in databases or logged.
3. Ensure all tests pass: `pytest -v backend/tests`.
4. Ensure frontend builds cleanly: `npm run build` in the `frontend/` directory.
5. Submit a pull request with clear conventional commit messages.

## Code of Conduct
PacketScope is an educational defensive cybersecurity project. Do not contribute offensive exploit modules, unauthorized capture mechanisms, or malware delivery components.
