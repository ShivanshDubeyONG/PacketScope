"""Structured logging configuration for PacketScope."""

import logging
import sys
from backend.app.core.config import settings


def setup_logging() -> logging.Logger:
    """Configure root logger with consistent formatting."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s:%(lineno)d] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger("packetscope")
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.propagate = False

    return root_logger


logger = setup_logging()
