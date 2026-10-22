"""Pytest fixtures and configuration for PacketScope test suite."""

import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.main import app
from scripts.generate_sample_pcap import generate_synthetic_pcap


@pytest.fixture(scope="session")
def sample_pcap_path():
    """Ensure synthetic sample PCAP exists and return its path."""
    pcap_dir = os.path.join(settings.BASE_DIR.parent, "sample_data")
    os.makedirs(pcap_dir, exist_ok=True)
    pcap_file = os.path.join(pcap_dir, "synthetic_sample.pcap")
    if not os.path.exists(pcap_file):
        generate_synthetic_pcap(pcap_file)
    return pcap_file


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh in-memory or temporary file SQLite database for each test."""
    temp_dir = tempfile.mkdtemp()
    db_file = os.path.join(temp_dir, "test_packetscope.db")
    test_engine = create_engine(
        f"sqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)
        shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def client(db_session):
    """Provide a TestClient with overridden database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
