from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
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

# Add Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Add OpenTelemetry instrumentation
FastAPIInstrumentor.instrument_app(app)

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
    return {
        "status": "ok",
        "version": "0.1.0",
        "environment": settings.environment,
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