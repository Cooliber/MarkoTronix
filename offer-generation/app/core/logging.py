"""
Structured logging configuration for the offer generation service.

This module provides:
1. Structured logging with JSON format
2. Request ID correlation
3. Contextual logging with additional metadata
4. Log level configuration based on environment
"""

import json
import logging
import os
import sys
import time
import uuid
from typing import Any, Dict, Optional

import structlog
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# Get environment variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
ENV = os.getenv("ENVIRONMENT", "development")

# Configure default logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)


def get_log_level() -> int:
    """Get the log level from environment variable."""
    return getattr(logging, LOG_LEVEL)


class JsonFormatter(logging.Formatter):
    """Format logs as JSON for better parsing."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as JSON."""
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "service": "offer-generation",
            "environment": ENV,
        }
        
        # Add extra fields from the record
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
            
        # Add any other extra fields
        for key, value in record.__dict__.items():
            if key not in {
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "id", "levelname", "levelno", "lineno", "module",
                "msecs", "message", "msg", "name", "pathname", "process",
                "processName", "relativeCreated", "stack_info", "thread", "threadName",
            }:
                log_data[key] = value
                
        # Handle exceptions
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_data)


class StructuredLogger(logging.Logger):
    """Logger that adds structured context to log records."""
    
    def makeRecord(
        self,
        name: str,
        level: int,
        fn: str,
        lno: int,
        msg: object,
        args: Any,
        exc_info: Any,
        func: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
        sinfo: Optional[str] = None,
    ) -> logging.LogRecord:
        """Create a log record with additional context."""
        record = super().makeRecord(name, level, fn, lno, msg, args, exc_info, func, extra, sinfo)
        
        # Add request_id from thread local storage if available
        if hasattr(request_context, "request_id"):
            record.request_id = request_context.request_id
            
        return record


# Thread-local storage for request context
class RequestContext:
    """Thread-local storage for request context."""
    
    def __init__(self):
        self.request_id = None


request_context = RequestContext()


def setup_structlog():
    """Set up structlog for structured logging."""
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def setup_logging(app: FastAPI) -> None:
    """Set up structured logging for the application."""
    # Set up structlog
    setup_structlog()
    
    # Create and configure the JSON formatter
    json_formatter = JsonFormatter()
    
    # Configure the root logger
    root_logger = logging.getLogger()
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    # Add a handler with the JSON formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(json_formatter)
    root_logger.addHandler(handler)
    
    # Set the logger class to our StructuredLogger
    logging.setLoggerClass(StructuredLogger)
    
    # Set log level based on environment
    log_level = get_log_level()
    root_logger.setLevel(log_level)
    
    # Log that logging has been set up
    logger = get_logger(__name__)
    logger.info(
        f"Logging configured with level {logging.getLevelName(log_level)}",
        extra={"environment": ENV},
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name."""
    return logging.getLogger(name)


def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to each request."""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Process the request and add request ID."""
        # Get or generate request ID
        request_id = request.headers.get("X-Request-ID", generate_request_id())
        
        # Store in request state
        request.state.request_id = request_id
        
        # Store in thread-local storage
        request_context.request_id = request_id
        
        # Process the request
        start_time = time.time()
        
        # Get logger
        logger = get_logger("api.request")
        
        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_host": request.client.host if request.client else None,
                "user_agent": request.headers.get("User-Agent"),
            },
        )
        
        # Process the request
        response = await call_next(request)
        
        # Calculate request duration
        duration_ms = round((time.time() - start_time) * 1000)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        # Log response
        logger.info(
            f"Request completed: {request.method} {request.url.path} {response.status_code}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        
        # Clear thread-local storage
        request_context.request_id = None
        
        return response


def setup_middleware(app: FastAPI) -> None:
    """Set up middleware for the application."""
    app.add_middleware(RequestIdMiddleware)