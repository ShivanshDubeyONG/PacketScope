"""Database engine and session management for PacketScope."""

from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings
from backend.app.core.logging import logger

# SQLite connection URL
database_url = f"sqlite:///{settings.SQLITE_DB_PATH}"

engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False},
    echo=False,
)


# Enforce foreign key constraints in SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields an active database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables according to defined models."""
    logger.info("Initializing database tables...")
    # Import all models to register with Base.metadata
    import backend.app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully at %s", settings.SQLITE_DB_PATH)
