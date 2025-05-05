# Circuit Breaker Management Runbook

This runbook provides guidance on managing circuit breakers in the HVAC CRM system.

## Overview

Circuit breakers are used to prevent cascading failures when external services are unavailable. When a circuit breaker is open, requests to the protected service will fail fast without attempting to call the service, giving it time to recover.

## Monitoring Circuit Breakers

### Grafana Dashboard

The circuit breaker dashboard in Grafana provides real-time monitoring of all circuit breakers in the system:

- **URL**: http://localhost:13000/d/circuit-breakers/circuit-breaker-dashboard
- **Username**: admin
- **Password**: admin

The dashboard shows:
- Current state of all circuit breakers
- Failure and success counts
- Rejected calls
- Call durations

### Prometheus Alerts

Prometheus is configured to alert when:
- A circuit breaker has been open for more than 10 minutes
- A circuit breaker has a high failure rate (> 10% over 5 minutes)

### Health Check Endpoint

Each service exposes a health check endpoint that includes the status of all circuit breakers:

- Mail Ingest Service: http://localhost:18001/health
- Offer Generation Service: http://localhost:18002/health
- Link Service: http://localhost:18003/health

## Handling Open Circuit Breakers

When a circuit breaker is open, follow these steps:

1. **Identify the affected service**:
   - Check the Grafana dashboard to see which circuit breaker is open
   - Check the service logs for error messages related to the external service

2. **Investigate the root cause**:
   - Check if the external service is available
   - Check if there are network issues
   - Check if there are authentication or authorization issues
   - Check if there are rate limiting issues

3. **Resolve the issue**:
   - If the external service is down, wait for it to recover or contact the service provider
   - If there are network issues, work with the network team to resolve them
   - If there are authentication or authorization issues, update the credentials
   - If there are rate limiting issues, reduce the request rate or request a higher limit

4. **Reset the circuit breaker**:
   - The circuit breaker will automatically transition to half-open state after the recovery timeout
   - If you need to manually reset the circuit breaker, use the API endpoint:

     ```bash
     # For mail-ingest-service
     curl -X POST http://localhost:18001/circuit-breakers/{name}/reset
     
     # For offer-generation
     curl -X POST http://localhost:18002/circuit-breakers/{name}/reset
     
     # For link-service
     curl -X POST http://localhost:18003/circuit-breakers/{name}/reset
     ```

   - Replace `{name}` with the name of the circuit breaker (e.g., `supabase`, `imap`, etc.)

5. **Verify the circuit breaker is closed**:
   - Check the Grafana dashboard to see if the circuit breaker is now closed
   - Check the service logs for success messages related to the external service
   - Test the functionality that uses the external service

## Circuit Breaker Configuration

Circuit breakers are configured in the code with the following parameters:

- **name**: Name of the circuit breaker for identification
- **failure_threshold**: Number of failures before opening the circuit (default: 5)
- **recovery_timeout**: Seconds to wait before trying again (default: 60.0)
- **expected_exceptions**: Set of exceptions that count as failures (default: Exception)
- **fallback**: Optional function to call when the circuit is open (default: None)

To change the configuration, update the code in the service and restart the service.

## Common Circuit Breakers

### Mail Ingest Service

- **imap**: Protects against IMAP server failures
- **supabase**: Protects against Supabase storage failures

### Offer Generation Service

- **openai**: Protects against OpenAI API failures
- **supabase**: Protects against Supabase storage failures

### Link Service

- **docusign**: Protects against DocuSign API failures
- **hellosign**: Protects against HelloSign API failures

## Troubleshooting

### Circuit Breaker Not Closing

If a circuit breaker remains open even after the external service is available:

1. Check if the recovery timeout has elapsed
2. Check if there are still failures when the circuit breaker is in half-open state
3. Try manually resetting the circuit breaker
4. Restart the service if necessary

### False Positives

If a circuit breaker is opening too frequently due to transient issues:

1. Increase the failure threshold
2. Add retry logic with backoff before the circuit breaker
3. Make sure the expected exceptions are correctly configured

### False Negatives

If a circuit breaker is not opening when it should:

1. Check if the expected exceptions are correctly configured
2. Decrease the failure threshold
3. Make sure the circuit breaker is correctly applied to all external service calls