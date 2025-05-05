# Core Modules Documentation

This document provides an overview of the core modules used in the HVAC CRM microservices for robustness and observability.

## Architecture Overview

The core modules provide a set of common functionality for all microservices:

- **Exception Handling**: Standardized exception handling and error responses
- **Structured Logging**: JSON-formatted logs with request ID correlation
- **Circuit Breaker**: Protection against cascading failures from external service dependencies
- **Health Checks**: Comprehensive health check endpoints for monitoring service health
- **Metrics**: Prometheus metrics for monitoring service performance

These modules are designed to be reusable across all microservices in the HVAC CRM system.

## Module Descriptions

### exceptions.py

The `exceptions.py` module provides a standardized exception handling system:

- **Custom Exception Classes**: Specific exception classes for different error scenarios
- **Global Exception Handler**: FastAPI exception handlers for consistent error responses
- **Standardized Error Response Format**: Consistent JSON format for all error responses
- **Automatic Logging**: Exceptions are automatically logged with request context

Key components:
- `ServiceException`: Base class for all service-specific exceptions
- `setup_exception_handlers()`: Function to register all exception handlers with FastAPI

Example usage:
```python
from fastapi import FastAPI
from app.core.exceptions import setup_exception_handlers, NotFoundException

app = FastAPI()
setup_exception_handlers(app)

@app.get("/items/{item_id}")
def read_item(item_id: int):
    item = get_item(item_id)
    if item is None:
        raise NotFoundException(f"Item {item_id} not found")
    return item
```

### logging.py

The `logging.py` module provides structured logging capabilities:

- **JSON-Formatted Logs**: All logs are formatted as JSON for better parsing
- **Request ID Correlation**: Request IDs are included in all logs for tracing
- **Contextual Logging**: Additional metadata can be included in logs
- **Log Level Configuration**: Log levels can be configured based on environment

Key components:
- `get_logger()`: Function to get a logger with the specified name
- `setup_logging()`: Function to set up structured logging for the application
- `setup_middleware()`: Function to set up request ID middleware

Example usage:
```python
from fastapi import FastAPI
from app.core.logging import get_logger, setup_logging, setup_middleware

app = FastAPI()
setup_logging(app)
setup_middleware(app)

logger = get_logger(__name__)

@app.get("/")
def read_root():
    logger.info("Root endpoint called", extra={"user_agent": "example"})
    return {"Hello": "World"}
```

### circuit_breaker.py

The `circuit_breaker.py` module implements the circuit breaker pattern:

- **Automatic Failure Detection**: Tracks failures and opens the circuit after a threshold
- **Automatic Recovery**: Transitions to half-open state after a timeout to test recovery
- **Configurable Thresholds**: Failure threshold and recovery timeout can be configured
- **Prometheus Metrics**: Circuit breaker state and statistics are exposed as metrics

Key components:
- `CircuitBreaker`: Class implementing the circuit breaker pattern
- `circuit_breaker()`: Decorator to apply circuit breaker pattern to a function
- `create_circuit_breaker()`: Function to create and register a circuit breaker

Example usage:
```python
from app.core.circuit_breaker import circuit_breaker
from app.core.exceptions import ExternalServiceException

@circuit_breaker(
    name="external-service",
    failure_threshold=3,
    recovery_timeout=60.0,
)
async def call_external_service(data):
    try:
        # Call external service
        response = await httpx.post("https://external-service.com/api", json=data)
        return response.json()
    except Exception as e:
        raise ExternalServiceException(f"External service call failed: {str(e)}")
```

### health.py

The `health.py` module provides health check endpoints:

- **Comprehensive Health Checks**: Checks all dependencies and components
- **Standardized Health Response**: Consistent JSON format for health status
- **Prometheus Metrics Endpoint**: Exposes metrics for monitoring
- **Circuit Breaker Status**: Includes circuit breaker status in health checks

Key components:
- `health_router`: FastAPI router with health check endpoints
- `HealthStatus`: Enum for health status values (OK, DEGRADED, CRITICAL)
- `HealthCheck`: Pydantic model for health check response

Example usage:
```python
from fastapi import FastAPI
from app.core.health import health_router

app = FastAPI()
app.include_router(health_router)
```

## Integration Guide

To integrate the core modules into a microservice:

1. **Install Dependencies**:
   ```bash
   pip install structlog tenacity prometheus-client
   ```

2. **Copy Core Modules**:
   Copy the core modules to the service's `app/core` directory.

3. **Set Up FastAPI App**:
   ```python
   from fastapi import FastAPI
   from app.core.logging import setup_logging, setup_middleware
   from app.core.exceptions import setup_exception_handlers
   from app.core.health import health_router

   app = FastAPI()

   # Set up logging
   setup_logging(app)

   # Set up exception handlers
   setup_exception_handlers(app)

   # Set up request ID middleware
   setup_middleware(app)

   # Include health check router
   app.include_router(health_router)
   ```

4. **Create Circuit Breakers**:
   ```python
   from app.core.circuit_breaker import create_circuit_breaker

   # Create circuit breakers for external services
   supabase_cb = create_circuit_breaker(
       name="supabase",
       failure_threshold=3,
       recovery_timeout=60.0,
   )

   # Use circuit breaker decorator for external service calls
   @circuit_breaker(
       name="supabase",
       failure_threshold=3,
       recovery_timeout=60.0,
   )
   async def upload_to_supabase(file_path):
       # Implementation
   ```

5. **Use Structured Logging**:
   ```python
   from app.core.logging import get_logger

   logger = get_logger(__name__)

   def process_data(data):
       logger.info(
           "Processing data",
           extra={
               "data_id": data.id,
               "data_type": data.type,
               "data_size": len(data.content),
           },
       )
       # Process data
       logger.info("Data processing completed")
   ```

6. **Use Custom Exceptions**:
   ```python
   from app.core.exceptions import NotFoundException, ValidationException

   def get_resource(resource_id):
       resource = db.query(Resource).filter(Resource.id == resource_id).first()
       if resource is None:
           raise NotFoundException(f"Resource {resource_id} not found")
       return resource

   def validate_data(data):
       if not data.get("required_field"):
           raise ValidationException("required_field is required")
       # Validate data
       return data
   ```

## Best Practices

### Exception Handling

- Use specific exception classes for different error scenarios
- Include enough context in exception messages for debugging
- Don't expose sensitive information in error responses
- Log exceptions with appropriate severity levels

### Logging

- Use structured logging for all log messages
- Include request IDs in all logs for tracing
- Include relevant context in log messages
- Use appropriate log levels (INFO, WARNING, ERROR, etc.)

### Circuit Breakers

- Use circuit breakers for all external service calls
- Configure appropriate failure thresholds and recovery timeouts
- Provide fallback mechanisms when possible
- Monitor circuit breaker status in health checks

### Health Checks

- Include all dependencies in health checks
- Use appropriate health status values (OK, DEGRADED, CRITICAL)
- Include detailed information in health check responses
- Expose health check endpoints for monitoring

### Metrics

- Expose Prometheus metrics for monitoring
- Include metrics for all key operations
- Use appropriate metric types (counter, gauge, histogram, etc.)
- Include labels for better filtering and aggregation