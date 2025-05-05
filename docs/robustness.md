# MarkoTronix Robustness Guidelines

This document outlines the robustness features implemented in the MarkoTronix HVAC CRM system to ensure high availability, resilience, and fault tolerance.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Error Handling](#error-handling)
3. [Circuit Breaker Pattern](#circuit-breaker-pattern)
4. [Retry Mechanisms](#retry-mechanisms)
5. [Logging and Monitoring](#logging-and-monitoring)
6. [Health Checks](#health-checks)
7. [Fallback Strategies](#fallback-strategies)
8. [Best Practices](#best-practices)

## Architecture Overview

The MarkoTronix system uses a microservices architecture with the following components:

- **Frontend**: Next.js application with client-side resilience
- **API Gateway**: FastAPI service that routes requests to microservices
- **Microservices**: Specialized services for specific domains (mail, offers, links)
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for caching and message queuing
- **Storage**: MinIO for file storage

## Error Handling

### Backend Error Handling

The backend uses a global exception handler that:

1. Captures all exceptions
2. Logs them with structured data
3. Returns standardized error responses
4. Includes request IDs for correlation

Example usage:

```python
# In app/main.py
from app.core.exceptions import setup_exception_handlers

# Set up exception handlers
setup_exception_handlers(app)
```

### Frontend Error Handling

The frontend uses React Error Boundaries to:

1. Catch and log component errors
2. Prevent the entire application from crashing
3. Display user-friendly error messages
4. Provide retry mechanisms

Example usage:

```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Circuit Breaker Pattern

### Backend Circuit Breaker

The backend uses a custom circuit breaker implementation that:

1. Monitors for failures in external service calls
2. Opens the circuit after a threshold of failures
3. Fails fast when the circuit is open
4. Attempts recovery after a timeout period

Example usage:

```python
# In app/routers/gateway/offers.py
from app.core.circuit_breaker import create_circuit_breaker

# Create circuit breaker
offer_circuit = create_circuit_breaker(
    name="offer-service",
    failure_threshold=3,
    recovery_timeout=30.0,
    expected_exceptions=(httpx.HTTPError, httpx.ConnectError, httpx.TimeoutException)
)

# Use circuit breaker
async def fetch_offers():
    # Implementation...
    
try:
    return await offer_circuit.call(fetch_offers)
except CircuitBreakerOpenError:
    # Fallback strategy
```

### Frontend Circuit Breaker

The frontend uses a similar circuit breaker pattern for API calls:

```typescript
// In src/api/axios.ts
import { createCircuitBreaker } from '@/utils/circuitBreaker';

// Create circuit breaker
export const apiCircuitBreaker = createCircuitBreaker({
  name: 'api',
  failureThreshold: 3,
  recoveryTimeout: 10000,
  fallback: (error) => {
    // Fallback strategy
  }
});

// Use circuit breaker
export async function executeWithCircuitBreaker<T>(apiCall: () => Promise<T>): Promise<T> {
  return apiCircuitBreaker.execute(apiCall);
}
```

## Retry Mechanisms

The system uses retry mechanisms with exponential backoff for transient failures:

### Backend Retry

```python
# In offer-generation/main.py
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def call_llm_api(prompt: str, ...):
    # Implementation...
```

### Frontend Retry

```typescript
// In src/api/axios.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry logic for authentication
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Retry with refreshed token
    }
    return Promise.reject(error);
  }
);
```

## Logging and Monitoring

### Structured Logging

The system uses structured logging for better searchability and analysis:

```python
# In app/core/logging.py
import structlog

# Configure structlog
structlog.configure(
    processors=[
        # Processors...
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
)

# Get a structured logger
logger = get_structured_logger("app.request")
logger.info("Request completed", status_code=response.status_code)
```

### Request Tracing

All requests include correlation IDs for tracing across services:

```python
# In app/core/logging.py
class LoggingMiddleware:
    async def __call__(self, request: Request, call_next):
        # Get or generate a request ID
        request_id = get_request_id(request)
        
        # Add the request ID to the response headers
        response.headers["X-Request-ID"] = request_id
```

## Health Checks

Each service provides a detailed health check endpoint:

### Backend Health Check

```python
@app.get("/health")
async def health_check():
    # Check database connection
    db_status = check_database()
    
    # Check external services
    services = check_services()
    
    # Check circuit breakers
    circuit_breaker_states = get_circuit_breaker_states()
    
    return {
        "status": "ok" if all_ok else "degraded",
        "components": {
            "database": db_status,
            "services": services,
            "circuit_breakers": circuit_breaker_states,
        }
    }
```

### Frontend Health Check

```javascript
// In pages/api/health.js
export default function handler(req, res) {
  // Get circuit breaker status
  const circuitBreakers = getAllCircuitBreakers();
  
  // Check if any circuit breakers are open
  const hasOpenCircuitBreakers = Object.values(circuitBreakers).some(
    (cb) => cb.getState().state === 'open'
  );
  
  res.status(200).json({
    status: hasOpenCircuitBreakers ? 'degraded' : 'ok',
    // Other health information
  });
}
```

## Fallback Strategies

The system implements fallback strategies for when services are unavailable:

### Backend Fallbacks

```python
# In app/routers/gateway/offers.py
try:
    return await offer_circuit.call(fetch_offers)
except CircuitBreakerOpenError:
    logger.error("Circuit breaker open - returning empty list")
    return []  # Return empty list as fallback
```

### Frontend Fallbacks

```typescript
// In src/api/dashboard.ts
try {
  return await executeWithCircuitBreaker(async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  });
} catch (error) {
  logger.error('Error fetching dashboard stats:', error);
  // Return default values as fallback
  return {
    newEmails: 0,
    tasksToday: 0,
    activeOffers: 0,
    monthlyRevenue: 0,
  };
}
```

## Best Practices

1. **Timeouts**: Always set appropriate timeouts for external calls
2. **Idempotency**: Ensure operations can be safely retried
3. **Graceful Degradation**: Provide fallbacks for critical features
4. **Monitoring**: Use metrics and alerts to detect issues early
5. **Testing**: Include chaos testing to verify resilience
6. **Documentation**: Keep this document updated with new resilience features

## Conclusion

By implementing these robustness features, the MarkoTronix system is designed to handle failures gracefully, recover automatically when possible, and provide a reliable user experience even when components are degraded.
