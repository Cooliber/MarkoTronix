# Monitoring Documentation

This document provides detailed information about the monitoring implementation in the HVAC CRM system.

## Overview

The HVAC CRM system uses Prometheus and Grafana for monitoring and alerting. This setup provides:

- **Metrics Collection**: Prometheus scrapes metrics from all services
- **Metrics Visualization**: Grafana dashboards visualize metrics
- **Alerting**: Prometheus alerts on critical conditions
- **Health Monitoring**: Health checks monitor service and dependency health

## Architecture

The monitoring architecture consists of the following components:

1. **Service Instrumentation**: Each service exposes metrics and health endpoints
2. **Prometheus**: Scrapes metrics from services and evaluates alert rules
3. **Grafana**: Visualizes metrics from Prometheus
4. **Alert Manager**: Manages and routes alerts (future enhancement)

## Prometheus

Prometheus is an open-source monitoring and alerting toolkit designed for reliability and scalability.

### Configuration

Prometheus is configured in `infra/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

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

### Alert Rules

Alert rules are configured in `infra/prometheus/alert_rules.yml`:

```yaml
groups:
  - name: circuit_breaker_alerts
    rules:
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state{state="open"} == 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker {{ $labels.name }} is open"
          description: "Circuit breaker {{ $labels.name }} has been open for more than 10 minutes."

  - name: service_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate for {{ $labels.job }}"
          description: "{{ $labels.job }} has a high error rate (> 1% over 5 minutes)."

  # More alert rules...
```

### Accessing Prometheus

Prometheus is accessible at http://localhost:19090

## Grafana

Grafana is an open-source platform for monitoring and observability.

### Dashboards

Grafana dashboards are configured in `infra/grafana/dashboards/`:

- **Circuit Breaker Dashboard**: Shows circuit breaker states and statistics
- **Mail Ingest Dashboard**: Shows mail ingest service metrics
- **Offer Generation Dashboard**: Shows offer generation service metrics
- **Link Service Dashboard**: Shows link service metrics

### Accessing Grafana

Grafana is accessible at http://localhost:13000

- **Username**: admin
- **Password**: admin

## Service Metrics

Each service exposes metrics through the `/metrics` endpoint. These metrics are collected by Prometheus and visualized in Grafana.

### Common Metrics

All services expose the following common metrics:

- **http_requests_total**: Total number of HTTP requests
- **http_request_duration_seconds**: HTTP request duration
- **circuit_breaker_state**: Current state of circuit breakers
- **circuit_breaker_failures_total**: Total number of circuit breaker failures
- **circuit_breaker_successes_total**: Total number of circuit breaker successes
- **circuit_breaker_rejected_total**: Total number of rejected calls due to open circuit breakers
- **circuit_breaker_call_duration_seconds**: Duration of calls through circuit breakers

### Mail Ingest Service Metrics

The mail ingest service exposes the following additional metrics:

- **mail_ingest_emails_fetched_total**: Total number of emails fetched
- **mail_ingest_emails_processed_total**: Total number of emails processed
- **mail_ingest_attachments_processed_total**: Total number of attachments processed
- **mail_ingest_email_fetch_duration_seconds**: Time spent fetching emails
- **mail_ingest_attachment_upload_duration_seconds**: Time spent uploading attachments

### Offer Generation Service Metrics

The offer generation service exposes the following additional metrics:

- **offer_generation_offers_created_total**: Total number of offers created
- **offer_generation_offers_rendered_total**: Total number of offers rendered
- **offer_generation_pdf_generation_duration_seconds**: Time spent generating PDFs
- **offer_generation_template_rendering_duration_seconds**: Time spent rendering templates
- **offer_generation_openai_call_duration_seconds**: Time spent calling OpenAI API

### Link Service Metrics

The link service exposes the following additional metrics:

- **link_service_links_created_total**: Total number of links created
- **link_service_links_accessed_total**: Total number of links accessed
- **link_service_signature_requests_created_total**: Total number of signature requests created
- **link_service_signature_requests_completed_total**: Total number of signature requests completed
- **link_service_docusign_call_duration_seconds**: Time spent calling DocuSign API
- **link_service_hellosign_call_duration_seconds**: Time spent calling HelloSign API

## Health Checks

Each service exposes a health check endpoint at `/health`. This endpoint returns detailed information about the service's health, including:

- **Overall Status**: ok, degraded, or critical
- **Database Health**: Status of the database connection
- **Redis Health**: Status of the Redis connection
- **External Service Health**: Status of external services
- **Circuit Breaker Status**: Status of all circuit breakers

For more information, see the [Health Checks Documentation](health_checks.md).

## Alerting

Prometheus is configured to alert on critical conditions. These alerts are defined in `infra/prometheus/alert_rules.yml`.

### Alert Rules

The following alert rules are configured:

- **CircuitBreakerOpen**: A circuit breaker has been open for more than 10 minutes
- **HighFailureRate**: A circuit breaker has a high failure rate (> 10% over 5 minutes)
- **HighErrorRate**: A service has a high error rate (> 1% over 5 minutes)
- **HighLatency**: A service has a high 95th percentile latency (> 1s over 5 minutes)
- **ServiceDown**: A service is down for more than 1 minute
- **DatabaseConnectionFailures**: A service has more than 5 database connection failures per minute

### Alert Response

For information on how to respond to alerts, see the [Alert Response Runbook](../runbooks/alert_response.md).

## Docker Compose Integration

Prometheus and Grafana are integrated into the Docker Compose setup:

```yaml
services:
  # Prometheus for monitoring
  prometheus:
    image: prom/prometheus:v2.45.0
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./infra/prometheus/alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus-data:/prometheus
    ports:
      - "19090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
      
  # Grafana for visualization
  grafana:
    image: grafana/grafana:10.0.3
    volumes:
      - grafana-data:/var/lib/grafana
      - ./infra/grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    ports:
      - "13000:3000"
    depends_on:
      - prometheus
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

## Best Practices

### Metrics Design

- Use appropriate metric types (counter, gauge, histogram, summary)
- Use meaningful metric names and labels
- Include units in metric names (e.g., `_seconds`, `_bytes`)
- Keep cardinality under control (avoid high-cardinality labels)

### Dashboard Design

- Use appropriate visualization types for different metrics
- Include context and explanations in dashboards
- Use consistent naming and formatting
- Group related metrics together

### Alerting

- Set appropriate thresholds for alerts
- Include enough context in alert messages
- Avoid alert fatigue by reducing false positives
- Set up proper alert routing and escalation

### Monitoring

- Monitor all critical components and dependencies
- Monitor both technical and business metrics
- Set up proper retention policies for metrics
- Regularly review and update monitoring configuration

## Troubleshooting

### Prometheus Not Scraping Metrics

If Prometheus is not scraping metrics from a service:

1. Check if the service is running
2. Check if the `/metrics` endpoint is accessible
3. Check the Prometheus configuration
4. Check the Prometheus logs for errors

### Grafana Not Showing Metrics

If Grafana is not showing metrics:

1. Check if Prometheus is scraping the metrics
2. Check if the Grafana data source is configured correctly
3. Check if the Grafana dashboard is using the correct queries
4. Check the Grafana logs for errors

### Alerts Not Firing

If alerts are not firing when they should:

1. Check if the alert rule is configured correctly
2. Check if the alert rule is being evaluated
3. Check if the alert condition is being met
4. Check the Prometheus logs for errors

### False Positive Alerts

If alerts are firing when they shouldn't:

1. Check if the alert threshold is appropriate
2. Check if there are transient issues causing false positives
3. Adjust the alert rule to reduce false positives
4. Consider adding a longer duration to the alert rule