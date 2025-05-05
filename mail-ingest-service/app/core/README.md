# Core Modules for Mail Ingest Service

This directory contains core modules that provide robustness and observability features for the mail ingest service.

## Modules

### exceptions.py

Provides a standardized exception handling system:

- Custom exception classes for different error scenarios
- Global exception handler for FastAPI
- Standardized error response format
- Automatic logging of exceptions with request context

### logging.py

Provides structured logging capabilities:

- JSON-formatted logs for better parsing
- Request ID correlation across logs
- Contextual logging with additional metadata
- Log level configuration based on environment

### circuit_breaker.py

Implements the circuit breaker pattern to prevent cascading failures:

- Automatic tracking of failures and recovery
- Configurable thresholds and timeouts
- Integration with the logging system
- Prometheus metrics for monitoring

### health.py

Provides health check endpoints and monitoring:

- `/health` endpoint for service health status
- `/metrics` endpoint for Prometheus metrics
- Checks for database connectivity
- Checks for Redis connectivity
- Checks for IMAP server connectivity
- Checks for circuit breaker status

## Usage

### Setting Up Core Modules

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

### Using Circuit Breakers

```python
from app.core.circuit_breaker import circuit_breaker
from app.core.exceptions import ExternalServiceException

@circuit_breaker(
    name="external-service",
    failure_threshold=3,
    recovery_timeout=60.0,
    expected_exceptions={Exception},
)
async def call_external_service(data):
    try:
        # Call external service
        response = await httpx.post("https://external-service.com/api", json=data)
        return response.json()
    except Exception as e:
        raise ExternalServiceException(f"External service call failed: {str(e)}")
```

### Using Structured Logging

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

### Using Custom Exceptions

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

## Testing

The core modules have comprehensive unit and integration tests:

- `tests/unit/test_circuit_breaker.py`: Tests for the circuit breaker implementation
- `tests/unit/test_health.py`: Tests for the health check implementation
- `tests/integration/test_health_endpoints.py`: Tests for the health check endpoints
- `tests/integration/test_circuit_breaker_integration.py`: Tests for the circuit breaker integration

Run the tests with pytest:

```bash
pytest tests/unit/
pytest tests/integration/
```