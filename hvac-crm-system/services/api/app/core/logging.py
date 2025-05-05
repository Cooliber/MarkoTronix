import logging
import sys
import time
import uuid
from typing import Dict, Any, Optional
import structlog
from fastapi import Request

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

def get_request_id(request: Optional[Request] = None) -> str:
    """
    Get a unique request ID from the request headers or generate a new one.
    """
    if request:
        # Try to get the request ID from the headers
        request_id = request.headers.get("X-Request-ID")
        if request_id:
            return request_id
    
    # Generate a new request ID if none exists
    return str(uuid.uuid4())

def get_structured_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Get a structured logger with the given name.
    """
    return structlog.get_logger(name)

def setup_logging(level: str = "INFO") -> None:
    """
    Set up logging with the given log level.
    """
    # Set up the root logger
    logging.basicConfig(
        level=getattr(logging, level),
        format="%(message)s",
        stream=sys.stdout,
    )
    
    # Set the log level for other loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    
    # Set the log level for SQLAlchemy
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Set the log level for httpx
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Set the log level for our app
    logging.getLogger("app").setLevel(getattr(logging, level))

class LoggingMiddleware:
    """
    Middleware to add request logging with correlation IDs.
    """
    
    async def __call__(self, request: Request, call_next):
        # Get or generate a request ID
        request_id = get_request_id(request)
        
        # Add the request ID to the request state
        request.state.request_id = request_id
        
        # Create a logger for this request
        logger = get_structured_logger("app.request")
        
        # Log the request
        logger = logger.bind(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_host=request.client.host if request.client else None,
        )
        
        start_time = time.time()
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Calculate the request duration
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            # Log the response
            logger.info(
                "Request completed",
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
            
            # Add the request ID to the response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Calculate the request duration
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            # Log the exception
            logger.error(
                "Request failed",
                error=str(e),
                error_type=type(e).__name__,
                duration_ms=duration_ms,
            )
            
            # Re-raise the exception
            raise
