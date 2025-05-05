# Alert Response Runbook

This runbook provides guidance on responding to alerts in the HVAC CRM system.

## Overview

The HVAC CRM system uses Prometheus and Grafana for monitoring and alerting. Alerts are configured to notify when there are issues with the system that require attention.

## Alert Severity Levels

Alerts are categorized by severity:

- **Critical**: Requires immediate attention. The system is down or severely degraded.
- **Warning**: Requires attention soon. The system is degraded but still functioning.
- **Info**: Informational only. No immediate action required.

## Accessing Alerts

Alerts can be viewed in the following places:

- **Prometheus Alerts**: http://localhost:19090/alerts
- **Grafana Alerts**: http://localhost:13000/alerting/list

## Common Alerts and Response Procedures

### CircuitBreakerOpen

**Description**: A circuit breaker has been open for more than 10 minutes.

**Severity**: Warning

**Response Procedure**:

1. Identify the affected circuit breaker and service
2. Check the service logs for error messages related to the external service
3. Follow the [Circuit Breaker Management Runbook](circuit_breaker_management.md) to resolve the issue

### HighFailureRate

**Description**: A circuit breaker has a high failure rate (> 10% over 5 minutes).

**Severity**: Warning

**Response Procedure**:

1. Identify the affected circuit breaker and service
2. Check the service logs for error messages related to the external service
3. Investigate the root cause of the failures
4. Follow the [Circuit Breaker Management Runbook](circuit_breaker_management.md) to resolve the issue

### HighErrorRate

**Description**: A service has a high error rate (> 1% over 5 minutes).

**Severity**: Warning

**Response Procedure**:

1. Identify the affected service
2. Check the service logs for error messages
3. Check the service health endpoint for more information
4. Investigate the root cause of the errors
5. Resolve the issue or escalate to the appropriate team

### HighLatency

**Description**: A service has a high 95th percentile latency (> 1s over 5 minutes).

**Severity**: Warning

**Response Procedure**:

1. Identify the affected service
2. Check the service logs for slow operations
3. Check the service health endpoint for more information
4. Check if the service is under high load
5. Check if external services used by the service are slow
6. Resolve the issue or escalate to the appropriate team

### ServiceDown

**Description**: A service is down for more than 1 minute.

**Severity**: Critical

**Response Procedure**:

1. Identify the affected service
2. Check if the service container is running:
   ```bash
   docker ps | grep <service-name>
   ```
3. Check the service logs for error messages:
   ```bash
   docker logs <container-id>
   ```
4. Try to restart the service:
   ```bash
   docker restart <container-id>
   ```
5. If the service fails to start, check the service configuration and dependencies
6. Resolve the issue or escalate to the appropriate team

### DatabaseConnectionFailures

**Description**: A service has more than 5 database connection failures per minute.

**Severity**: Critical

**Response Procedure**:

1. Identify the affected service
2. Check if the database is running:
   ```bash
   docker ps | grep postgres
   ```
3. Check the database logs for error messages:
   ```bash
   docker logs <postgres-container-id>
   ```
4. Check if the database is under high load
5. Check if the database has enough resources
6. Try to restart the database if necessary:
   ```bash
   docker restart <postgres-container-id>
   ```
7. Resolve the issue or escalate to the appropriate team

## Escalation Path

If you are unable to resolve an alert, escalate to the appropriate team:

1. **Level 1**: On-call engineer
2. **Level 2**: Service owner
3. **Level 3**: Engineering manager
4. **Level 4**: CTO

## Post-Incident Procedures

After resolving an alert:

1. Document the incident in the incident log
2. Conduct a post-mortem if necessary
3. Identify and implement preventive measures
4. Update this runbook if necessary