"""Main FastAPI application entry point for PacketScope."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.v1.router import api_router
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.core.exceptions import PacketScopeException
from backend.app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context for startup and shutdown events."""
    logger.info("Starting %s in %s mode...", settings.PROJECT_NAME, settings.ENV)
    init_db()
    tshark_path = settings.resolved_tshark_path
    if tshark_path:
        logger.info("TShark detected and ready at: %s", tshark_path)
    else:
        logger.warning(
            "TShark was NOT detected. Packet parsing will return errors until TShark is installed or configured."
        )
    yield
    logger.info("Shutting down %s...", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PacketScope — Web-Based PCAP and Network Traffic Analysis Platform (Defensive Cybersecurity Engine)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(PacketScopeException)
async def packetscope_exception_handler(request: Request, exc: PacketScopeException):
    logger.warning("PacketScopeException handled: [%s] %s", exc.code, exc.message)
    status_code = status.HTTP_400_BAD_REQUEST
    if exc.code == "CAPTURE_NOT_FOUND":
        status_code = status.HTTP_404_NOT_FOUND
    elif exc.code == "FILE_TOO_LARGE":
        status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    elif exc.code == "TSHARK_NOT_FOUND":
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
                "details": None,
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal error occurred during packet processing.",
                "details": str(exc) if settings.DEBUG else None,
            }
        },
    )


# Include API v1 Routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "PacketScope API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
