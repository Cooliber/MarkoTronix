from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, Any, Optional, List, Union
import logging
import traceback
import time
import uuid
from pydantic import BaseModel

# Configure logger
logger = logging.getLogger(__name__)

# Error response model
class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[Union[List[Dict[str, Any]], Dict[str, Any], str]] = None
    request_id: str
    timestamp: float

def get_error_details(exc: Exception) -> Dict[str, Any]:
    """Extract useful details from an exception."""
    return {
        "type": exc.__class__.__name__,
        "message": str(exc),
        "traceback": traceback.format_exc() if logger.level <= logging.DEBUG else None
    }

def setup_exception_handlers(app: FastAPI) -> None:
    """Configure global exception handlers for the FastAPI application."""
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors."""
        request_id = str(uuid.uuid4())
        timestamp = time.time()
        
        # Log the error
        logger.error(
            f"Validation error: request_id={request_id}, "
            f"url={request.url}, method={request.method}, "
            f"errors={exc.errors()}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponse(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                details=exc.errors(),
                request_id=request_id,
                timestamp=timestamp
            ).dict(),
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        """Handle database errors."""
        request_id = str(uuid.uuid4())
        timestamp = time.time()
        
        # Log the error
        logger.error(
            f"Database error: request_id={request_id}, "
            f"url={request.url}, method={request.method}, "
            f"error={str(exc)}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                code="DATABASE_ERROR",
                message="A database error occurred",
                details=get_error_details(exc) if logger.level <= logging.DEBUG else None,
                request_id=request_id,
                timestamp=timestamp
            ).dict(),
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions."""
        request_id = str(uuid.uuid4())
        timestamp = time.time()
        
        # Log the error
        logger.error(
            f"Unhandled exception: request_id={request_id}, "
            f"url={request.url}, method={request.method}, "
            f"error={str(exc)}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected error occurred",
                details=get_error_details(exc) if logger.level <= logging.DEBUG else None,
                request_id=request_id,
                timestamp=timestamp
            ).dict(),
        )
