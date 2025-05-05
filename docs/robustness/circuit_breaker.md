# Circuit Breaker Pattern Documentation

This document provides detailed information about the circuit breaker pattern implementation in the HVAC CRM system.

## Overview

The circuit breaker pattern is used to prevent cascading failures when external services are unavailable. It works by monitoring for failures and "opening" the circuit when a threshold is reached, preventing further calls to the failing service and giving it time to recover.

## States

The circuit breaker has three states:

1. **Closed**: Normal operation. Requests pass through to the service.
2. **Open**: Circuit is open. Requests fail fast without calling the service.
3. **Half-Open**: Testing if the service is back online. A single request is allowed through to test the service.

## State Transitions

The circuit breaker transitions between states based on the following rules:

1. **Closed to Open**: When the failure count reaches the failure threshold.
2. **Open to Half-Open**: After the recovery timeout has elapsed.
3. **Half-Open to Closed**: When a request succeeds in the half-open state.
4. **Half-Open to Open**: When a request fails in the half-open state.

## Implementation

The circuit breaker is implemented in the `circuit_breaker.py` module:

```python
from app.core.circuit_breaker import (
    CircuitBreaker,
    circuit_breaker,
    create_circuit_breaker,
    get_circuit_breaker,
    get_all_circuit_breakers,
)
```

### CircuitBreaker Class

The `CircuitBreaker` class implements the circuit breaker pattern:

```python
class CircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        expected_exceptions: Optional[Set[Type[Exception]]] = None,
        fallback: Optional[Callable[..., Any]] = None,
    ):
        # Implementation
```

Parameters:
- `name`: Name of the circuit breaker for identification
- `failure_threshold`: Number of failures before opening the circuit (default: 5)
- `recovery_timeout`: Seconds to wait before trying again (default: 60.0)
- `expected_exceptions`: Set of exceptions that count as failures (default: Exception)
- `fallback`: Optional function to call when the circuit is open (default: None)

Methods:
- `get_state()`: Get the current state of the circuit breaker
- `reset()`: Reset the circuit breaker to its initial state
- `call(func, *args, **kwargs)`: Call a function with circuit breaker protection

### circuit_breaker Decorator

The `circuit_breaker` decorator applies the circuit breaker pattern to a function:

```python
@circuit_breaker(
    name="external-service",
    failure_threshold=3,
    recovery_timeout=60.0,
    expected_exceptions={Exception},
    fallback=None,
)
async def call_external_service(data):
    # Implementation
```

Parameters:
- `name`: Name of the circuit breaker
- `failure_threshold`: Number of failures before opening the circuit
- `recovery_timeout`: Seconds to wait before trying again
- `expected_exceptions`: Set of exceptions that count as failures
- `fallback`: Optional function to call when the circuit is open

### Registry Functions

The module provides functions to create and retrieve circuit breakers:

- `create_circuit_breaker()`: Create and register a new circuit breaker
- `get_circuit_breaker()`: Get a circuit breaker by name
- `get_all_circuit_breakers()`: Get all registered circuit breakers

## Usage Examples

### Basic Usage

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

### With Fallback

```python
from app.core.circuit_breaker import circuit_breaker
from app.core.exceptions import ExternalServiceException

async def fallback_function(data):
    # Provide fallback functionality
    return {"status": "fallback", "data": data}

@circuit_breaker(
    name="external-service",
    failure_threshold=3,
    recovery_timeout=60.0,
    fallback=fallback_function,
)
async def call_external_service(data):
    try:
        # Call external service
        response = await httpx.post("https://external-service.com/api", json=data)
        return response.json()
    except Exception as e:
        raise ExternalServiceException(f"External service call failed: {str(e)}")
```

### With Specific Exceptions

```python
from app.core.circuit_breaker import circuit_breaker
from app.core.exceptions import ExternalServiceException

@circuit_breaker(
    name="external-service",
    failure_threshold=3,
    recovery_timeout=60.0,
    expected_exceptions={httpx.HTTPError, httpx.TimeoutException},
)
async def call_external_service(data):
    try:
        # Call external service
        response = await httpx.post("https://external-service.com/api", json=data)
        return response.json()
    except Exception as e:
        raise ExternalServiceException(f"External service call failed: {str(e)}")
```

### Manual Circuit Breaker

```python
from app.core.circuit_breaker import create_circuit_breaker

# Create circuit breaker
cb = create_circuit_breaker(
    name="external-service",
    failure_threshold=3,
    recovery_timeout=60.0,
)

async def call_external_service(data):
    try:
        # Call the function with circuit breaker protection
        return await cb.call(
            httpx.post,
            "https://external-service.com/api",
            json=data,
        )
    except Exception as e:
        raise ExternalServiceException(f"External service call failed: {str(e)}")
```

## Monitoring

The circuit breaker exposes Prometheus metrics for monitoring:

- `circuit_breaker_state`: Current state of the circuit breaker (closed, open, half_open)
- `circuit_breaker_failures_total`: Total number of failures detected by circuit breakers
- `circuit_breaker_successes_total`: Total number of successful calls through circuit breakers
- `circuit_breaker_rejected_total`: Total number of rejected calls due to open circuit breakers
- `circuit_breaker_call_duration_seconds`: Duration of calls through circuit breakers

These metrics can be viewed in the Grafana dashboard:
http://localhost:13000/d/circuit-breakers/circuit-breaker-dashboard

## Health Check Integration

The circuit breaker status is included in the health check response:

```json
{
  "status": "ok",
  "timestamp": "2023-07-26T12:34:56.789Z",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "database": {
    "status": "ok",
    "message": "Database connection successful",
    "last_checked": "2023-07-26T12:34:56.789Z",
    "response_time_ms": 50
  },
  "redis": {
    "status": "ok",
    "message": "Redis connection successful",
    "last_checked": "2023-07-26T12:34:56.789Z",
    "response_time_ms": 20
  },
  "circuit_breakers": [
    {
      "name": "external-service",
      "state": "closed",
      "failure_count": 0,
      "last_failure_time": null,
      "failure_threshold": 3,
      "recovery_timeout": 60.0
    }
  ]
}
```

## Best Practices

### Configuration

- Set appropriate failure thresholds based on the service's reliability
- Set appropriate recovery timeouts based on the service's recovery time
- Use specific exception types to avoid false positives

### Error Handling

- Wrap external service calls in try-except blocks
- Raise specific exceptions for different error scenarios
- Include enough context in exception messages for debugging

### Fallbacks

- Provide fallback functionality when possible
- Make fallbacks as simple and reliable as possible
- Clearly communicate to users when fallback functionality is being used

### Monitoring

- Monitor circuit breaker states in Grafana
- Set up alerts for open circuit breakers
- Set up alerts for high failure rates

## Troubleshooting

### Circuit Breaker Not Opening

If a circuit breaker is not opening when it should:

- Check if the expected exceptions are correctly configured
- Check if the failure threshold is appropriate
- Check if the exceptions are being caught and re-raised correctly

### Circuit Breaker Not Closing

If a circuit breaker is not closing when it should:

- Check if the recovery timeout has elapsed
- Check if the service is actually available
- Check if the half-open test request is succeeding

### False Positives

If a circuit breaker is opening too frequently due to transient issues:

- Increase the failure threshold
- Add retry logic with backoff before the circuit breaker
- Make sure the expected exceptions are correctly configured

### False Negatives

If a circuit breaker is not opening when it should:

- Check if the expected exceptions are correctly configured
- Decrease the failure threshold
- Make sure the circuit breaker is correctly applied to all external service calls