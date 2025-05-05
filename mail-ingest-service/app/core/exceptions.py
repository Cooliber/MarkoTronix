"""
Global exception handling for the mail-ingest service.

This module provides:
1. Custom exception classes for different error scenarios
2. A global exception handler for FastAPI
3. Standardized error response format
4. Automatic logging of exceptions with request context
"""

import traceback
from typing import Any, Dict, List, Optional, Type, Union

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)


# Error response model
class ErrorDetail(BaseModel):
    """Details about a specific error."""
    loc: Optional[List[str]] = Field(None, description="Location of the error")
    msg: str = Field(..., description="Error message")
    type: str = Field(..., description="Error type")


class ErrorResponse(BaseModel):
    """Standardized error response format."""
    status_code: int = Field(..., description="HTTP status code")
    message: str = Field(..., description="Error message")
    details: Optional[List[ErrorDetail]] = Field(None, description="Detailed error information")
    request_id: Optional[str] = Field(None, description="Request ID for correlation")


# Custom exception classes
class ServiceException(Exception):
    """Base exception for all service-specific exceptions."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred"
    error_type: str = "service_error"

    def __init__(self, detail: Optional[str] = None, status_code: Optional[int] = None):
        self.detail = detail or self.detail
        self.status_code = status_code or self.status_code
        super().__init__(self.detail)


class NotFoundException(ServiceException):
    """Exception raised when a requested resource is not found."""
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found"
    error_type = "not_found"


class ValidationException(ServiceException):
    """Exception raised when input validation fails."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation error"
    error_type = "validation_error"


class AuthenticationException(ServiceException):
    """Exception raised when authentication fails."""
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication failed"
    error_type = "authentication_error"


class AuthorizationException(ServiceException):
    """Exception raised when authorization fails."""
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Not authorized to perform this action"
    error_type = "authorization_error"


class DatabaseException(ServiceException):
    """Exception raised when a database operation fails."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Database operation failed"
    error_type = "database_error"


class ExternalServiceException(ServiceException):
    """Exception raised when an external service call fails."""
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "External service call failed"
    error_type = "external_service_error"


class CircuitBreakerOpenException(ServiceException):
    """Exception raised when a circuit breaker is open."""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    detail = "Service temporarily unavailable due to circuit breaker"
    error_type = "circuit_breaker_open"


class RateLimitException(ServiceException):
    """Exception raised when rate limit is exceeded."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    detail = "Rate limit exceeded"
    error_type = "rate_limit_exceeded"


# Email-specific exceptions
class EmailFetchException(ServiceException):
    """Exception raised when fetching emails fails."""
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "Failed to fetch emails from mail server"
    error_type = "email_fetch_error"


class EmailParseException(ServiceException):
    """Exception raised when parsing an email fails."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Failed to parse email content"
    error_type = "email_parse_error"


class AttachmentProcessingException(ServiceException):
    """Exception raised when processing email attachments fails."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Failed to process email attachments"
    error_type = "attachment_processing_error"


# Exception handlers
async def service_exception_handler(request: Request, exc: ServiceException) -> JSONResponse:
    """Handle custom service exceptions."""
    # Get request ID from request state if available
    request_id = getattr(request.state, "request_id", None)
    
    # Log the exception with context
    logger.error(
        f"Service exception: {exc.detail}",
        extra={
            "request_id": request_id,
            "status_code": exc.status_code,
            "error_type": exc.error_type,
            "path": request.url.path,
            "method": request.method,
        },
    )
    
    # Create standardized error response
    error_response = ErrorResponse(
        status_code=exc.status_code,
        message=exc.detail,
        details=[
            ErrorDetail(
                msg=exc.detail,
                type=exc.error_type,
            )
        ],
        request_id=request_id,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict(exclude_none=True),
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    # Get request ID from request state if available
    request_id = getattr(request.state, "request_id", None)
    
    # Log the exception with context
    logger.error(
        f"HTTP exception: {exc.detail}",
        extra={
            "request_id": request_id,
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
        },
    )
    
    # Create standardized error response
    error_response = ErrorResponse(
        status_code=exc.status_code,
        message=str(exc.detail),
        details=[
            ErrorDetail(
                msg=str(exc.detail),
                type="http_error",
            )
        ],
        request_id=request_id,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict(exclude_none=True),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle validation exceptions."""
    # Get request ID from request state if available
    request_id = getattr(request.state, "request_id", None)
    
    # Extract error details
    error_details = []
    for error in exc.errors():
        error_details.append(
            ErrorDetail(
                loc=error.get("loc", []),
                msg=error.get("msg", ""),
                type=error.get("type", ""),
            )
        )
    
    # Log the exception with context
    logger.warning(
        "Validation error",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "errors": [error.dict() for error in error_details],
        },
    )
    
    # Create standardized error response
    error_response = ErrorResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message="Validation error",
        details=error_details,
        request_id=request_id,
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.dict(exclude_none=True),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unhandled exceptions."""
    # Get request ID from request state if available
    request_id = getattr(request.state, "request_id", None)
    
    # Get traceback
    tb = traceback.format_exc()
    
    # Log the exception with context
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "traceback": tb,
            "exception_type": type(exc).__name__,
        },
    )
    
    # Create standardized error response
    # In production, we don't want to expose internal error details
    is_production = True  # TODO: Get from config
    
    error_message = "Internal server error" if is_production else str(exc)
    error_details = None if is_production else [
        ErrorDetail(
            msg=str(exc),
            type="internal_error",
        )
    ]
    
    error_response = ErrorResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message=error_message,
        details=error_details,
        request_id=request_id,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.dict(exclude_none=True),
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Set up all exception handlers for the FastAPI application."""
    # Register handlers for custom exceptions
    app.add_exception_handler(ServiceException, service_exception_handler)
    
    # Register handlers for FastAPI/Starlette exceptions
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Register handler for unhandled exceptions
    app.add_exception_handler(Exception, unhandled_exception_handler)
    
    logger.info("Exception handlers configured")