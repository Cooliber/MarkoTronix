"""
Core modules for the offer generation service.

This package provides:
1. Exception handling and standardized error responses
2. Structured logging with request ID correlation
3. Circuit breaker pattern implementation
4. Health check endpoints and monitoring
"""

from core.exceptions import (
    setup_exception_handlers,
    ServiceException,
    NotFoundException,
    ValidationException,
    AuthenticationException,
    AuthorizationException,
    DatabaseException,
    ExternalServiceException,
    CircuitBreakerOpenException,
    RateLimitException,
)
from core.logging import get_logger, setup_logging, setup_middleware
from core.circuit_breaker import (
    create_circuit_breaker,
    circuit_breaker,
    get_circuit_breaker,
    get_all_circuit_breakers,
)
from core.health import health_router, HealthStatus

__all__ = [
    "setup_exception_handlers",
    "ServiceException",
    "NotFoundException",
    "ValidationException",
    "AuthenticationException",
    "AuthorizationException",
    "DatabaseException",
    "ExternalServiceException",
    "CircuitBreakerOpenException",
    "RateLimitException",
    "get_logger",
    "setup_logging",
    "setup_middleware",
    "create_circuit_breaker",
    "circuit_breaker",
    "get_circuit_breaker",
    "get_all_circuit_breakers",
    "health_router",
    "HealthStatus",
]