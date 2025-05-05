from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
from typing import Dict, Any

# Telemetry and monitoring
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Import routers
from app.routers import auth, clients, emails, transcriptions, offers, services, dashboard
from app.routers.gateway import router as gateway_router

# Import exception handlers and logging
from app.core.exceptions import setup_exception_handlers
from app.core.logging import setup_logging, LoggingMiddleware, get_structured_logger

# Import database and settings
from app.core.config import settings
from app.core.database import engine, Base
from app.core.security import get_current_user

# Create tables
Base.metadata.create_all(bind=engine)

# Configure OpenTelemetry
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name=os.getenv("JAEGER_HOST", "jaeger"),
    agent_port=int(os.getenv("JAEGER_PORT", "6831")),
)
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(jaeger_exporter))

# Set up logging
setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))
logger = get_structured_logger("app.main")

# Create FastAPI app
app = FastAPI(
    title="HVAC CRM API",
    description="API for HVAC CRM System",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Add Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Add OpenTelemetry instrumentation
FastAPIInstrumentor.instrument_app(app)

# Set up exception handlers
setup_exception_handlers(app)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/clients", tags=["Clients"])
app.include_router(emails.router, prefix="/emails", tags=["Emails"])
app.include_router(transcriptions.router, prefix="/transcriptions", tags=["Transcriptions"])
app.include_router(offers.router, prefix="/offers", tags=["Offers"])
app.include_router(services.router, prefix="/services", tags=["Services"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(gateway_router, tags=["Gateway"])

@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for monitoring.
    """
    import time
    import platform
    import psutil
    from sqlalchemy import text
    from app.core.database import SessionLocal

    # Check database connection
    db_status = "ok"
    db_error = None
    db_latency_ms = 0

    try:
        db = SessionLocal()
        start_time = time.time()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        db_status = "error"
        db_error = str(e)
    finally:
        db.close()

    # Get system info
    system_info = {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "python_version": platform.python_version(),
        "platform": platform.platform(),
    }

    # Check external services
    services = {}

    # Check circuit breakers
    from app.core.circuit_breaker import circuit_breakers
    circuit_breaker_states = {
        name: cb.get_state() for name, cb in circuit_breakers.items()
    }

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "version": "0.1.0",
        "environment": settings.environment,
        "timestamp": time.time(),
        "uptime_seconds": time.time() - psutil.boot_time(),
        "database": {
            "status": db_status,
            "error": db_error,
            "latency_ms": db_latency_ms,
        },
        "system": system_info,
        "services": services,
        "circuit_breakers": circuit_breaker_states,
    }

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint that redirects to the API documentation.
    """
    return {"message": "Welcome to HVAC CRM API. Visit /docs for API documentation."}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=settings.environment == "development",
    )