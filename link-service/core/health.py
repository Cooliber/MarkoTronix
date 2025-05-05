"""
Health check implementation for the link service.

This module provides:
1. A health check endpoint for the service
2. Checks for database connectivity
3. Checks for external service connectivity
4. Checks for circuit breaker status
"""

import asyncio
import time
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from core.circuit_breaker import get_all_circuit_breakers
from core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)


class HealthStatus(str, Enum):
    """Possible health statuses."""
    
    OK = "ok"
    DEGRADED = "degraded"
    CRITICAL = "critical"


class ComponentHealth(BaseModel):
    """Health status of a component."""
    
    status: HealthStatus = Field(..., description="Health status of the component")
    message: Optional[str] = Field(None, description="Additional information")
    last_checked: datetime = Field(..., description="When the component was last checked")
    response_time_ms: Optional[int] = Field(None, description="Response time in milliseconds")


class ServiceHealth(BaseModel):
    """Health status of an external service."""
    
    name: str = Field(..., description="Name of the service")
    status: HealthStatus = Field(..., description="Health status of the service")
    message: Optional[str] = Field(None, description="Additional information")
    last_checked: datetime = Field(..., description="When the service was last checked")
    response_time_ms: Optional[int] = Field(None, description="Response time in milliseconds")


class CircuitBreakerHealth(BaseModel):
    """Health status of a circuit breaker."""
    
    name: str = Field(..., description="Name of the circuit breaker")
    state: str = Field(..., description="Current state of the circuit breaker")
    failure_count: int = Field(..., description="Number of consecutive failures")
    last_failure_time: Optional[datetime] = Field(None, description="Time of the last failure")
    failure_threshold: int = Field(..., description="Threshold for opening the circuit")
    recovery_timeout: float = Field(..., description="Timeout for recovery in seconds")


class HealthCheck(BaseModel):
    """Complete health check response."""
    
    status: HealthStatus = Field(..., description="Overall health status")
    timestamp: datetime = Field(..., description="Time of the health check")
    version: str = Field(..., description="Service version")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")
    database: ComponentHealth = Field(..., description="Database health")
    redis: Optional[ComponentHealth] = Field(None, description="Redis health")
    external_services: List[ServiceHealth] = Field(default_factory=list, description="External service health")
    circuit_breakers: List[CircuitBreakerHealth] = Field(default_factory=list, description="Circuit breaker status")
    request_id: Optional[str] = Field(None, description="Request ID for correlation")


# External services to check
EXTERNAL_SERVICES = [
    # Add external services here
    # Example: {"name": "docusign", "url": "https://api.docusign.com/health"}
]

# Start time of the service
START_TIME = time.time()


async def check_database_health() -> ComponentHealth:
    """Check the health of the database."""
    start_time = time.time()
    status = HealthStatus.OK
    message = "Database connection successful"
    
    try:
        # TODO: Implement actual database check
        # Example: await database.execute("SELECT 1")
        await asyncio.sleep(0.1)  # Simulate database check
    except Exception as e:
        status = HealthStatus.CRITICAL
        message = f"Database connection failed: {str(e)}"
        logger.error(f"Database health check failed: {str(e)}")
    
    response_time_ms = int((time.time() - start_time) * 1000)
    
    return ComponentHealth(
        status=status,
        message=message,
        last_checked=datetime.now(),
        response_time_ms=response_time_ms,
    )


async def check_redis_health() -> ComponentHealth:
    """Check the health of Redis."""
    start_time = time.time()
    status = HealthStatus.OK
    message = "Redis connection successful"
    
    try:
        # TODO: Implement actual Redis check
        # Example: await redis.ping()
        await asyncio.sleep(0.05)  # Simulate Redis check
    except Exception as e:
        status = HealthStatus.DEGRADED  # Redis is not critical, so degraded
        message = f"Redis connection failed: {str(e)}"
        logger.error(f"Redis health check failed: {str(e)}")
    
    response_time_ms = int((time.time() - start_time) * 1000)
    
    return ComponentHealth(
        status=status,
        message=message,
        last_checked=datetime.now(),
        response_time_ms=response_time_ms,
    )


async def check_external_service(service: Dict[str, str]) -> ServiceHealth:
    """Check the health of an external service."""
    start_time = time.time()
    status = HealthStatus.OK
    message = f"{service['name']} service is available"
    
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(service["url"])
            if response.status_code >= 400:
                status = HealthStatus.DEGRADED
                message = f"{service['name']} service returned status {response.status_code}"
    except Exception as e:
        status = HealthStatus.DEGRADED
        message = f"{service['name']} service is unavailable: {str(e)}"
        logger.error(f"External service health check failed for {service['name']}: {str(e)}")
    
    response_time_ms = int((time.time() - start_time) * 1000)
    
    return ServiceHealth(
        name=service["name"],
        status=status,
        message=message,
        last_checked=datetime.now(),
        response_time_ms=response_time_ms,
    )


def check_circuit_breakers() -> List[CircuitBreakerHealth]:
    """Check the status of all circuit breakers."""
    circuit_breakers = []
    
    for name, cb in get_all_circuit_breakers().items():
        state = cb.get_state()
        
        # Convert timestamp to datetime if it exists
        last_failure_time = None
        if state["last_failure_time"] > 0:
            last_failure_time = datetime.fromtimestamp(state["last_failure_time"])
        
        circuit_breakers.append(
            CircuitBreakerHealth(
                name=name,
                state=state["state"],
                failure_count=state["failure_count"],
                last_failure_time=last_failure_time,
                failure_threshold=state["failure_threshold"],
                recovery_timeout=state["recovery_timeout"],
            )
        )
    
    return circuit_breakers


def determine_overall_status(
    database: ComponentHealth,
    redis: Optional[ComponentHealth],
    external_services: List[ServiceHealth],
    circuit_breakers: List[CircuitBreakerHealth],
) -> HealthStatus:
    """Determine the overall health status."""
    # Critical if database is down
    if database.status == HealthStatus.CRITICAL:
        return HealthStatus.CRITICAL
    
    # Count degraded services
    degraded_count = 0
    
    if database.status == HealthStatus.DEGRADED:
        degraded_count += 1
    
    if redis and redis.status != HealthStatus.OK:
        degraded_count += 1
    
    for service in external_services:
        if service.status != HealthStatus.OK:
            degraded_count += 1
    
    # Check if any circuit breakers are open
    open_circuit_breakers = [cb for cb in circuit_breakers if cb.state == "open"]
    if open_circuit_breakers:
        degraded_count += 1
    
    # Critical if more than 50% of components are degraded
    total_components = 2 + len(external_services)  # Database, Redis, and external services
    if degraded_count > total_components / 2:
        return HealthStatus.CRITICAL
    
    # Degraded if any component is degraded
    if degraded_count > 0:
        return HealthStatus.DEGRADED
    
    return HealthStatus.OK


# Create router
health_router = APIRouter(tags=["Health"])


@health_router.get("/health", response_model=HealthCheck)
async def health_check(request: Request) -> HealthCheck:
    """
    Perform a health check of the service.
    
    This endpoint checks:
    - Database connectivity
    - Redis connectivity
    - External service availability
    - Circuit breaker status
    
    Returns:
        A HealthCheck object with the status of all components
    """
    # Get request ID from request state
    request_id = getattr(request.state, "request_id", None)
    
    # Check database health
    database = await check_database_health()
    
    # Check Redis health
    redis = await check_redis_health()
    
    # Check external services in parallel
    external_services = await asyncio.gather(
        *[check_external_service(service) for service in EXTERNAL_SERVICES]
    )
    
    # Check circuit breakers
    circuit_breakers = check_circuit_breakers()
    
    # Determine overall status
    overall_status = determine_overall_status(
        database, redis, external_services, circuit_breakers
    )
    
    # Calculate uptime
    uptime_seconds = time.time() - START_TIME
    
    # Create health check response
    health = HealthCheck(
        status=overall_status,
        timestamp=datetime.now(),
        version="1.0.0",  # TODO: Get from config
        uptime_seconds=uptime_seconds,
        database=database,
        redis=redis,
        external_services=external_services,
        circuit_breakers=circuit_breakers,
        request_id=request_id,
    )
    
    # Log health check result
    if overall_status != HealthStatus.OK:
        logger.warning(
            f"Health check returned {overall_status} status",
            extra={
                "request_id": request_id,
                "database_status": database.status,
                "redis_status": redis.status if redis else None,
                "degraded_services": [
                    service.name for service in external_services if service.status != HealthStatus.OK
                ],
                "open_circuit_breakers": [
                    cb.name for cb in circuit_breakers if cb.state == "open"
                ],
            },
        )
    else:
        logger.info("Health check completed successfully", extra={"request_id": request_id})
    
    return health