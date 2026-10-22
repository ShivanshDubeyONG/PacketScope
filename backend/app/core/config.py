"""Central application configuration for PacketScope."""

import os
import shutil
from pathlib import Path
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def find_tshark_path() -> Optional[str]:
    """Auto-detect TShark binary on the current operating system."""
    # 1. Direct environment variable or config override
    env_path = os.getenv("TSHARK_PATH", "").strip()
    if env_path and os.path.isfile(env_path):
        return env_path

    # 2. Check system PATH
    which_path = shutil.which("tshark")
    if which_path:
        return which_path

    # 3. Common Windows paths
    windows_candidates = [
        r"C:\Program Files\Wireshark\tshark.exe",
        r"C:\Program Files (x86)\Wireshark\tshark.exe",
    ]
    for candidate in windows_candidates:
        if os.path.isfile(candidate):
            return candidate

    # 4. Common UNIX / macOS paths
    unix_candidates = [
        "/usr/bin/tshark",
        "/usr/local/bin/tshark",
        "/opt/homebrew/bin/tshark",
    ]
    for candidate in unix_candidates:
        if os.path.isfile(candidate):
            return candidate

    return None


class Settings(BaseSettings):
    """PacketScope Settings loaded from environment or defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    PROJECT_NAME: str = "PacketScope"
    ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "packetscope-defensive-secret-key-change-in-production"

    # CORS configuration (comma-separated or list)
    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    )

    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    DATA_DIR: Path = BASE_DIR / "data"
    SQLITE_DB_PATH: str = str(BASE_DIR / "data" / "packetscope.db")
    MAX_UPLOAD_SIZE_MB: int = 50

    # TShark settings
    TSHARK_PATH: Optional[str] = None

    # Detection Engine Thresholds (Configurable)
    PORT_SCAN_PORT_THRESHOLD: int = 15
    PORT_SCAN_WINDOW_SECONDS: float = 10.0
    CONNECTION_BURST_COUNT: int = 50
    CONNECTION_BURST_WINDOW_SECONDS: float = 5.0
    SYN_BURST_THRESHOLD: int = 20
    SYN_TO_FIN_RATIO: float = 3.0
    ICMP_FLOOD_PACKET_THRESHOLD: int = 30
    ICMP_FLOOD_WINDOW_SECONDS: float = 5.0
    LARGE_DNS_QUERY_LENGTH: int = 60
    TRAFFIC_CONCENTRATION_THRESHOLD: float = 0.60
    MONITORED_PORTS: str = "21,23,69,4444,1337,31337,6667,5555"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def monitored_ports_list(self) -> List[int]:
        ports: List[int] = []
        for p in self.MONITORED_PORTS.split(","):
            p_clean = p.strip()
            if p_clean.isdigit():
                ports.append(int(p_clean))
        return ports

    @property
    def resolved_tshark_path(self) -> Optional[str]:
        if self.TSHARK_PATH and os.path.isfile(self.TSHARK_PATH):
            return self.TSHARK_PATH
        return find_tshark_path()

    @property
    def is_tshark_available(self) -> bool:
        return self.resolved_tshark_path is not None


settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
