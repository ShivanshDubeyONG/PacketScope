"""Custom application exceptions and error models for PacketScope."""

from typing import Any, Optional
from fastapi import HTTPException, status


class PacketScopeException(Exception):
    """Base exception for PacketScope application."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details


class TSharkNotFoundError(PacketScopeException):
    """Raised when TShark/Wireshark is missing or cannot be executed."""

    def __init__(
        self,
        message: str = (
            "TShark executable not found. PacketScope requires TShark for packet analysis. "
            "Please ensure Wireshark/TShark is installed and available in system PATH or configured via TSHARK_PATH."
        ),
        details: Optional[Any] = None,
    ):
        super().__init__(message=message, code="TSHARK_NOT_FOUND", details=details)


class InvalidCaptureFileError(PacketScopeException):
    """Raised when uploaded file is empty, corrupted, or unsupported."""

    def __init__(self, message: str = "Invalid or corrupted PCAP capture file.", details: Optional[Any] = None):
        super().__init__(message=message, code="INVALID_CAPTURE_FILE", details=details)


class CaptureNotFoundError(PacketScopeException):
    """Raised when requested capture ID does not exist."""

    def __init__(self, capture_id: str):
        super().__init__(
            message=f"Capture with ID '{capture_id}' not found.",
            code="CAPTURE_NOT_FOUND",
            details={"capture_id": capture_id},
        )


class FileTooLargeError(PacketScopeException):
    """Raised when file size exceeds maximum configured upload limit."""

    def __init__(self, size_mb: float, max_mb: int):
        super().__init__(
            message=f"Uploaded file ({size_mb:.2f} MB) exceeds maximum allowed size of {max_mb} MB.",
            code="FILE_TOO_LARGE",
            details={"size_mb": size_mb, "max_mb": max_mb},
        )


class CaptureProcessingError(PacketScopeException):
    """Raised when an unrecoverable error occurs during PCAP processing."""

    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message=message, code="PROCESSING_ERROR", details=details)
