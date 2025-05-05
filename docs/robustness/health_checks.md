# Health Checks Documentation

This document provides detailed information about the health check implementation in the HVAC CRM system.

## Overview

Health checks are used to monitor the health of services and their dependencies. They provide information about the status of the service, its dependencies, and its components.

The HVAC CRM system implements comprehensive health checks that include:
- Database connectivity
- Redis connectivity
- External service availability
- Circuit breaker status
- Service-specific checks (e.g., IMAP server connectivity for mail-ingest-service)

## Endpoints

Each service exposes two endpoints for health and monitoring:

1. **Health Check Endpoint**: `/health`
   - Returns detailed information about the service's health
   - Includes status of all dependencies and components
   - Used by monitoring systems to check service health

2. **Metrics Endpoint**: `/metrics`
   - Exposes Prometheus metrics for monitoring
   - Includes metrics for all key operations
   - Used by Prometheus to scrape metrics

## Health Check Response

The health check endpoint returns a JSON response with the following structure:

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
  "imap": {
    "status": "ok",
    "message": "IMAP server connection successful",
    "last_checked": "2023-07-26T12:34:56.789Z",
    "response_time_ms": 150
  },
  "external_services": [
    {
      "name": "offer-generation",
      "status": "ok",
      "message": "offer-generation service is available",
      "last_checked": "2023-07-26T12:34:56.789Z",
      "response_time_ms": 100
    }
  ],
  "circuit_breakers": [
    {
      "name": "supabase",
      "state": "closed",
      "failure_count": 0,
      "last_failure_time": null,
      "failure_threshold": 3,
      "recovery_timeout": 60.0
    }
  ],
  "request_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Status Values

The health check response includes status values for the overall service and each component:

- **ok**: The component is healthy and functioning normally
- **degraded**: The component is functioning but with reduced performance or reliability
- **critical**: The component is not functioning and requires immediate attention

The overall status is determined based on the status of all components:
- **ok**: All components are ok
- **degraded**: At least one component is degraded, but no critical components
- **critical**: At least one critical component (e.g., database) is critical

## Implementation

The health check is implemented in the `health.py` module:

```python
from app.core.health import (
    health_router,
    HealthStatus,
    ComponentHealth,
    ServiceHealth,
    CircuitBreakerHealth,
    HealthCheck,
)
```

### HealthStatus Enum

The `HealthStatus` enum defines the possible health status values:

```python
class HealthStatus(str, Enum):
    """Possible health statuses."""
    
    OK = "ok"
    DEGRADED = "degraded"
    CRITICAL = "critical"
```

### Health Models

The module defines Pydantic models for health check responses:

- `ComponentHealth`: Health status of a component (e.g., database, Redis)
- `ServiceHealth`: Health status of an external service
- `CircuitBreakerHealth`: Health status of a circuit breaker
- `HealthCheck`: Complete health check response

### Health Check Functions

The module provides functions to check the health of various components:

- `check_database_health()`: Check the health of the database
- `check_redis_health()`: Check the health of Redis
- `check_imap_health()`: Check the health of the IMAP server (mail-ingest-service only)
- `check_external_service()`: Check the health of an external service
- `check_circuit_breakers()`: Check the status of all circuit breakers
- `determine_overall_status()`: Determine the overall health status based on component statuses

### Health Router

The `health_router` is a FastAPI router with health check endpoints:

```python
from fastapi import FastAPI
from app.core.health import health_router

app = FastAPI()
app.include_router(health_router)
```

## Service-Specific Health Checks

Each service implements service-specific health checks in addition to the common checks:

### Mail Ingest Service

- **IMAP Server**: Checks connectivity to the IMAP server
- **Supabase Storage**: Checks connectivity to Supabase storage

### Offer Generation Service

- **OpenAI API**: Checks connectivity to the OpenAI API
- **Supabase Storage**: Checks connectivity to Supabase storage

### Link Service

- **DocuSign API**: Checks connectivity to the DocuSign API
- **HelloSign API**: Checks connectivity to the HelloSign API

## Monitoring Integration

The health check endpoints are integrated with monitoring systems:

### Prometheus

Prometheus is configured to scrape the `/metrics` endpoint of each service:

```yaml
scrape_configs:
  - job_name: "mail-ingest-service"
    static_configs:
      - targets: ["mail-ingest-service:8000"]
    metrics_path: /metrics

  - job_name: "offer-generation"
    static_configs:
      - targets: ["offer-generation:8000"]
    metrics_path: /metrics

  - job_name: "link-service"
    static_configs:
      - targets: ["link-service:8000"]
    metrics_path: /metrics
```

### Grafana

Grafana dashboards are configured to visualize the metrics:

- **Circuit Breaker Dashboard**: Shows circuit breaker states and statistics
- **Mail Ingest Dashboard**: Shows mail ingest service metrics
- **Offer Generation Dashboard**: Shows offer generation service metrics
- **Link Service Dashboard**: Shows link service metrics

### Alerts

Prometheus is configured to alert when:
- A service is down for more than 1 minute
- A service has a high error rate (> 1% over 5 minutes)
- A service has a high 95th percentile latency (> 1s over 5 minutes)
- A circuit breaker has been open for more than 10 minutes
- A circuit breaker has a high failure rate (> 10% over 5 minutes)

## Usage Examples

### Checking Service Health

To check the health of a service, send a GET request to the `/health` endpoint:

```bash
curl http://localhost:18001/health
```

### Checking Metrics

To check the metrics of a service, send a GET request to the `/metrics` endpoint:

```bash
curl http://localhost:18001/metrics
```

### Monitoring in Grafana

To monitor the health of services in Grafana:

1. Open Grafana: http://localhost:13000
2. Log in with username `admin` and password `admin`
3. Navigate to the dashboards:
   - Circuit Breaker Dashboard
   - Mail Ingest Dashboard
   - Offer Generation Dashboard
   - Link Service Dashboard

## Best Practices

### Health Check Design

- Include all dependencies in health checks
- Use appropriate health status values (OK, DEGRADED, CRITICAL)
- Include detailed information in health check responses
- Make health checks lightweight and fast

### Monitoring

- Set up alerts for critical components
- Set up alerts for degraded performance
- Set up alerts for open circuit breakers
- Set up alerts for high error rates

### Response to Health Issues

- Follow the [Service Recovery Runbook](../runbooks/service_recovery.md) for service issues
- Follow the [Database Failure Runbook](../runbooks/database_failure.md) for database issues
- Follow the [Circuit Breaker Management Runbook](../runbooks/circuit_breaker_management.md) for circuit breaker issues
- Follow the [Alert Response Runbook](../runbooks/alert_response.md) for alert response procedures

## Troubleshooting

### Health Check Returns Degraded or Critical

If a health check returns a degraded or critical status:

1. Check the specific component that is degraded or critical
2. Check the message for more information
3. Check the service logs for error messages
4. Follow the appropriate runbook for the affected component

### Metrics Not Showing in Grafana

If metrics are not showing in Grafana:

1. Check if the service is running
2. Check if the `/metrics` endpoint is accessible
3. Check if Prometheus is scraping the endpoint
4. Check if Grafana is configured to use Prometheus as a data source

### False Positives

If health checks are reporting false positives:

1. Check the health check implementation for the affected component
2. Adjust thresholds or timeouts if necessary
3. Add retry logic for transient issues
4. Update the health check implementation if necessary