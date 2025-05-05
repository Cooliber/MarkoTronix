# Service Recovery Runbook

This runbook provides guidance on recovering services in the HVAC CRM system after failures.

## Overview

The HVAC CRM system consists of multiple microservices that may experience failures. This runbook covers procedures for recovering services after failures.

## Service Health Monitoring

### Health Check Endpoints

Each service exposes a health check endpoint that provides information about its health:

- Mail Ingest Service: http://localhost:18001/health
- Offer Generation Service: http://localhost:18002/health
- Link Service: http://localhost:18003/health

### Prometheus Alerts

Prometheus is configured to alert when:
- A service is down for more than 1 minute
- A service has a high error rate (> 1% over 5 minutes)
- A service has a high 95th percentile latency (> 1s over 5 minutes)

## Common Service Issues and Recovery

### Service Container Down

**Symptoms**:
- Service container is not running
- Service health check endpoint is not accessible
- Prometheus alert for ServiceDown is triggered

**Recovery**:

1. Check the status of the service container:
   ```bash
   docker ps -a | grep <service-name>
   ```

2. If the container has exited, check the logs for the reason:
   ```bash
   docker logs <container-id>
   ```

3. Start the container if it's stopped:
   ```bash
   docker start <container-id>
   ```

4. If the container fails to start, check for configuration issues:
   - Check environment variables
   - Check volume mounts
   - Check network configuration

5. If necessary, recreate the container:
   ```bash
   docker-compose up -d <service-name>
   ```

6. Verify that the service is healthy by checking its health endpoint.

### Service Unresponsive

**Symptoms**:
- Service container is running but not responding to requests
- Service health check endpoint returns errors or times out
- Services that depend on this service report errors

**Recovery**:

1. Check the service logs for errors:
   ```bash
   docker logs <container-id>
   ```

2. Check if the service is using excessive resources:
   ```bash
   docker stats <container-id>
   ```

3. Check if the service's dependencies are available:
   - Database
   - Redis
   - External services

4. Restart the service:
   ```bash
   docker restart <container-id>
   ```

5. If the service remains unresponsive, recreate the container:
   ```bash
   docker-compose up -d --force-recreate <service-name>
   ```

6. Verify that the service is healthy by checking its health endpoint.

### Service High Error Rate

**Symptoms**:
- Service is returning errors for a significant percentage of requests
- Service logs show frequent errors
- Prometheus alert for HighErrorRate is triggered

**Recovery**:

1. Check the service logs for error patterns:
   ```bash
   docker logs <container-id> | grep -i error
   ```

2. Check if the service's dependencies are experiencing issues:
   - Database connection errors
   - Redis connection errors
   - External service errors

3. Check if the service is under high load:
   ```bash
   docker stats <container-id>
   ```

4. If the errors are related to a specific external service, check the circuit breaker status:
   - Check the service's health endpoint for circuit breaker information
   - Follow the [Circuit Breaker Management Runbook](circuit_breaker_management.md) if necessary

5. If necessary, restart the service:
   ```bash
   docker restart <container-id>
   ```

6. Verify that the error rate has decreased by monitoring the service's metrics.

### Service High Latency

**Symptoms**:
- Service is responding slowly to requests
- Service logs show slow operations
- Prometheus alert for HighLatency is triggered

**Recovery**:

1. Check if the service is under high load:
   ```bash
   docker stats <container-id>
   ```

2. Check if the service's dependencies are slow:
   - Database queries
   - Redis operations
   - External service calls

3. Check for resource contention:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

4. If necessary, scale up the service resources:
   - Increase CPU allocation
   - Increase memory allocation

5. If the latency is related to a specific external service, check the circuit breaker status:
   - Check the service's health endpoint for circuit breaker information
   - Follow the [Circuit Breaker Management Runbook](circuit_breaker_management.md) if necessary

6. If necessary, restart the service:
   ```bash
   docker restart <container-id>
   ```

7. Verify that the latency has decreased by monitoring the service's metrics.

## Service-Specific Recovery Procedures

### Mail Ingest Service

The Mail Ingest Service is responsible for fetching emails from IMAP servers and processing them.

**Common Issues**:
- IMAP server connection failures
- Email parsing errors
- Attachment processing errors

**Recovery**:

1. Check if the IMAP server is available:
   - Check the service's health endpoint for IMAP status
   - Try connecting to the IMAP server manually if possible

2. Check if the service can connect to the database and Redis:
   - Check the service's health endpoint for database and Redis status
   - Check the database and Redis logs for errors

3. If necessary, restart the service:
   ```bash
   docker restart <mail-ingest-container-id>
   ```

4. For email processing issues, check the email queue in Redis:
   ```bash
   docker exec -it <redis-container-id> redis-cli LLEN process_email
   ```

5. For attachment processing issues, check the attachments directory:
   ```bash
   docker exec -it <mail-ingest-container-id> ls -la /app/attachments
   ```

### Offer Generation Service

The Offer Generation Service is responsible for generating offers based on templates and data.

**Common Issues**:
- OpenAI API connection failures
- PDF generation errors
- Template rendering errors

**Recovery**:

1. Check if the OpenAI API is available:
   - Check the service's health endpoint for OpenAI status
   - Check if the API key is valid

2. Check if the service can connect to the database and Redis:
   - Check the service's health endpoint for database and Redis status
   - Check the database and Redis logs for errors

3. For PDF generation issues, check if the required libraries are installed:
   ```bash
   docker exec -it <offer-generation-container-id> pip list | grep -E 'weasyprint|pyppeteer'
   ```

4. If necessary, restart the service:
   ```bash
   docker restart <offer-generation-container-id>
   ```

### Link Service

The Link Service is responsible for generating and managing links for offers and signatures.

**Common Issues**:
- DocuSign API connection failures
- HelloSign API connection failures
- JWT token generation errors

**Recovery**:

1. Check if the DocuSign and HelloSign APIs are available:
   - Check the service's health endpoint for DocuSign and HelloSign status
   - Check if the API keys are valid

2. Check if the service can connect to the database and Redis:
   - Check the service's health endpoint for database and Redis status
   - Check the database and Redis logs for errors

3. For JWT token issues, check if the secret key is properly set:
   ```bash
   docker exec -it <link-service-container-id> env | grep SECRET_KEY
   ```

4. If necessary, restart the service:
   ```bash
   docker restart <link-service-container-id>
   ```

## Full System Recovery

In case of a complete system failure, follow these steps to recover all services:

1. Start the database and Redis:
   ```bash
   docker-compose up -d postgres redis
   ```

2. Wait for the database and Redis to be healthy:
   ```bash
   docker-compose ps postgres redis
   ```

3. Start the remaining services:
   ```bash
   docker-compose up -d
   ```

4. Verify that all services are healthy by checking their health endpoints.

## Preventive Measures

To prevent service failures:

1. **Monitor Service Health**:
   - Set up alerts for service downtime
   - Set up alerts for high error rates
   - Set up alerts for high latency

2. **Implement Circuit Breakers**:
   - Protect against external service failures
   - Configure appropriate thresholds and timeouts
   - Provide fallback mechanisms

3. **Implement Retry Mechanisms**:
   - Use exponential backoff for retries
   - Set appropriate retry limits
   - Handle transient failures gracefully

4. **Implement Health Checks**:
   - Check all dependencies
   - Provide detailed health information
   - Expose health endpoints for monitoring

5. **Implement Graceful Degradation**:
   - Provide fallback functionality when dependencies are unavailable
   - Prioritize critical functionality
   - Communicate degraded status to users

## Escalation Path

If you are unable to recover a service, escalate to the appropriate team:

1. **Level 1**: On-call engineer
2. **Level 2**: Service owner
3. **Level 3**: Engineering manager
4. **Level 4**: CTO