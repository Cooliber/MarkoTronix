# HVAC CRM System Monitoring Guide

This guide provides information on monitoring the HVAC CRM system, including metrics, dashboards, and alerting.

## Monitoring Stack

The HVAC CRM system uses the following tools for monitoring:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **Flower**: Celery task monitoring
- **RedisInsight**: Redis monitoring
- **Prometheus Node Exporter**: Host metrics
- **Prometheus Alert Manager**: Alerting

## Accessing Monitoring Tools

- Grafana: http://localhost:3000 (default credentials: admin/admin)
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686
- Flower: http://localhost:5555 (default credentials: admin/admin)
- RedisInsight: http://localhost:8001

## Key Metrics

### System Metrics

- **CPU Usage**: CPU usage by container and host
- **Memory Usage**: Memory usage by container and host
- **Disk Usage**: Disk usage by container and host
- **Network Traffic**: Network traffic by container and host

### API Service Metrics

- **Request Rate**: Number of requests per second
- **Error Rate**: Number of errors per second
- **Response Time**: Time to process requests (p50, p90, p99)
- **Endpoint Usage**: Most frequently used endpoints
- **Authentication Failures**: Number of failed authentication attempts

### Worker Service Metrics

- **Task Queue Length**: Number of tasks in the queue
- **Task Processing Time**: Time to process tasks (p50, p90, p99)
- **Task Success Rate**: Percentage of successfully completed tasks
- **Task Failure Rate**: Percentage of failed tasks
- **Worker Count**: Number of active workers

### Database Metrics

- **Query Rate**: Number of queries per second
- **Query Time**: Time to execute queries (p50, p90, p99)
- **Connection Count**: Number of active connections
- **Transaction Rate**: Number of transactions per second
- **Table Size**: Size of database tables
- **Index Size**: Size of database indexes

### Redis Metrics

- **Command Rate**: Number of commands per second
- **Memory Usage**: Memory usage by Redis
- **Connection Count**: Number of active connections
- **Eviction Rate**: Number of keys evicted per second
- **Hit Rate**: Cache hit rate

### Storage Metrics

- **Request Rate**: Number of requests per second
- **Error Rate**: Number of errors per second
- **Disk Usage**: Disk usage by bucket
- **Object Count**: Number of objects by bucket

## Dashboards

### System Dashboard

The System Dashboard provides an overview of the system health and resource usage.

**Metrics Displayed**:
- CPU Usage
- Memory Usage
- Disk Usage
- Network Traffic
- Container Status

**Use Cases**:
- Monitoring overall system health
- Identifying resource bottlenecks
- Planning capacity

### API Dashboard

The API Dashboard provides detailed information about the API service performance.

**Metrics Displayed**:
- Request Rate
- Error Rate
- Response Time
- Endpoint Usage
- Authentication Failures

**Use Cases**:
- Monitoring API performance
- Identifying slow endpoints
- Detecting unusual traffic patterns

### Worker Dashboard

The Worker Dashboard provides information about the worker service and task processing.

**Metrics Displayed**:
- Task Queue Length
- Task Processing Time
- Task Success Rate
- Task Failure Rate
- Worker Count

**Use Cases**:
- Monitoring task processing
- Identifying bottlenecks
- Detecting failing tasks

### Database Dashboard

The Database Dashboard provides information about the database performance.

**Metrics Displayed**:
- Query Rate
- Query Time
- Connection Count
- Transaction Rate
- Table Size
- Index Size

**Use Cases**:
- Monitoring database performance
- Identifying slow queries
- Planning database maintenance

### Redis Dashboard

The Redis Dashboard provides information about the Redis performance.

**Metrics Displayed**:
- Command Rate
- Memory Usage
- Connection Count
- Eviction Rate
- Hit Rate

**Use Cases**:
- Monitoring Redis performance
- Identifying memory issues
- Optimizing cache usage

### Storage Dashboard

The Storage Dashboard provides information about the storage service.

**Metrics Displayed**:
- Request Rate
- Error Rate
- Disk Usage
- Object Count

**Use Cases**:
- Monitoring storage usage
- Planning capacity
- Detecting unusual activity

## Alerting

### Alert Rules

The system includes the following alert rules:

#### High CPU Usage

```yaml
- alert: HighCpuUsage
  expr: container_cpu_usage_seconds_total{name=~"hvac-crm-.*"} > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage on {{ $labels.name }}"
    description: "{{ $labels.name }} has high CPU usage ({{ $value }})"
```

#### High Memory Usage

```yaml
- alert: HighMemoryUsage
  expr: container_memory_usage_bytes{name=~"hvac-crm-.*"} / container_spec_memory_limit_bytes{name=~"hvac-crm-.*"} > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage on {{ $labels.name }}"
    description: "{{ $labels.name }} has high memory usage ({{ $value }})"
```

#### High Disk Usage

```yaml
- alert: HighDiskUsage
  expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High disk usage on {{ $labels.instance }}"
    description: "{{ $labels.instance }} has high disk usage ({{ $value }})"
```

#### API Service Down

```yaml
- alert: ApiServiceDown
  expr: up{job="api"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "API service is down"
    description: "API service has been down for more than 1 minute"
```

#### Worker Service Down

```yaml
- alert: WorkerServiceDown
  expr: up{job="worker"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Worker service is down"
    description: "Worker service has been down for more than 1 minute"
```

#### Database Down

```yaml
- alert: DatabaseDown
  expr: up{job="postgres"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Database is down"
    description: "Database has been down for more than 1 minute"
```

#### Redis Down

```yaml
- alert: RedisDown
  expr: up{job="redis"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Redis is down"
    description: "Redis has been down for more than 1 minute"
```

#### Storage Down

```yaml
- alert: StorageDown
  expr: up{job="storage"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Storage is down"
    description: "Storage has been down for more than 1 minute"
```

#### High Error Rate

```yaml
- alert: HighErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "High error rate"
    description: "Error rate is above 5% ({{ $value }})"
```

#### Slow Response Time

```yaml
- alert: SlowResponseTime
  expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Slow response time"
    description: "95th percentile of response time is above 1 second ({{ $value }})"
```

#### Task Queue Backlog

```yaml
- alert: TaskQueueBacklog
  expr: celery_tasks_queued > 100
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Task queue backlog"
    description: "Task queue has more than 100 tasks ({{ $value }})"
```

#### High Task Failure Rate

```yaml
- alert: HighTaskFailureRate
  expr: sum(rate(celery_tasks_failed_total[5m])) / sum(rate(celery_tasks_total[5m])) > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High task failure rate"
    description: "Task failure rate is above 5% ({{ $value }})"
```

### Alert Channels

Alerts can be sent to the following channels:

#### Email

```yaml
receivers:
  - name: email
    email_configs:
      - to: 'alerts@example.com'
        from: 'prometheus@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'prometheus'
        auth_password: 'password'
        send_resolved: true
```

#### Slack

```yaml
receivers:
  - name: slack
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
        channel: '#alerts'
        send_resolved: true
```

#### SMS (via Twilio)

```yaml
receivers:
  - name: sms
    webhook_configs:
      - url: 'http://n8n:5678/webhook/twilio-sms'
        send_resolved: true
```

#### Telegram

```yaml
receivers:
  - name: telegram
    webhook_configs:
      - url: 'http://n8n:5678/webhook/telegram'
        send_resolved: true
```

### Alert Routing

Alerts are routed based on severity:

```yaml
route:
  receiver: 'default'
  group_by: ['alertname', 'instance']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  routes:
    - match:
        severity: critical
      receiver: 'critical'
    - match:
        severity: warning
      receiver: 'warning'
```

## Tracing

The system uses Jaeger for distributed tracing.

### Trace Sampling

Trace sampling is configured to capture:

- 100% of error traces
- 10% of slow traces (>500ms)
- 1% of all other traces

### Trace Context Propagation

Trace context is propagated through:

- HTTP headers
- Redis messages
- Database queries

### Viewing Traces

1. Open the Jaeger UI at http://localhost:16686
2. Select a service from the dropdown
3. Configure the search parameters
4. Click "Find Traces"
5. Click on a trace to view its details

### Common Trace Scenarios

#### API Request Flow

1. Client sends request to API
2. API processes request
3. API queries database
4. API returns response

#### Task Processing Flow

1. API enqueues task
2. Worker picks up task
3. Worker processes task
4. Worker updates database
5. Worker completes task

## Custom Metrics

### Adding Custom Metrics

To add custom metrics to the API service:

1. Define the metric in `services/api/app/core/metrics.py`:

```python
from prometheus_client import Counter, Histogram, Gauge

# Counter for tracking events
EVENT_COUNTER = Counter(
    'app_events_total',
    'Total number of events',
    ['event_type']
)

# Histogram for measuring durations
DURATION_HISTOGRAM = Histogram(
    'app_duration_seconds',
    'Duration in seconds',
    ['operation'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# Gauge for tracking current values
ACTIVE_USERS_GAUGE = Gauge(
    'app_active_users',
    'Number of active users'
)
```

2. Use the metrics in your code:

```python
# Increment a counter
EVENT_COUNTER.labels(event_type='login').inc()

# Measure duration
with DURATION_HISTOGRAM.labels(operation='database_query').time():
    # Perform operation
    result = db.execute(query)

# Set a gauge value
ACTIVE_USERS_GAUGE.set(active_users_count)
```

### Exposing Custom Metrics

Custom metrics are automatically exposed on the `/metrics` endpoint of the API service.

## Performance Tuning

### API Service

- Increase the number of workers
- Optimize database queries
- Implement caching
- Use connection pooling

### Worker Service

- Increase the number of workers
- Optimize task processing
- Use task priorities
- Implement task routing

### Database

- Add indexes for frequently queried fields
- Optimize queries
- Increase connection pool size
- Configure appropriate memory settings

### Redis

- Increase memory limit
- Configure appropriate eviction policy
- Use Redis Cluster for high availability
- Implement key expiration

## Logging

### Log Levels

The system uses the following log levels:

- **DEBUG**: Detailed information for debugging
- **INFO**: General information about system operation
- **WARNING**: Potential issues that don't affect normal operation
- **ERROR**: Errors that prevent specific operations
- **CRITICAL**: Critical errors that prevent system operation

### Log Formats

Logs are formatted as JSON for easy parsing:

```json
{
  "timestamp": "2023-07-21T12:34:56.789Z",
  "level": "INFO",
  "service": "api",
  "message": "Request processed successfully",
  "request_id": "123456",
  "user_id": "789",
  "duration_ms": 42
}
```

### Log Storage

Logs are stored in:

- Container logs (accessible via `docker-compose logs`)
- Persistent volume for long-term storage
- External log aggregation service (optional)

### Log Rotation

Logs are rotated based on:

- Size (100MB per file)
- Time (daily rotation)
- Retention (7 days)

### Log Analysis

Logs can be analyzed using:

- Grep and other command-line tools
- Grafana Loki (if configured)
- External log analysis tools (if configured)

## Capacity Planning

### Resource Requirements

#### Minimum Requirements

- **CPU**: 4 cores
- **Memory**: 8GB
- **Disk**: 100GB
- **Network**: 100Mbps

#### Recommended Requirements

- **CPU**: 8 cores
- **Memory**: 16GB
- **Disk**: 500GB
- **Network**: 1Gbps

### Scaling Factors

- **Users**: Each concurrent user requires approximately 10MB of memory
- **Clients**: Each 1,000 clients requires approximately 100MB of database storage
- **Files**: Each 1,000 files requires approximately 1GB of storage
- **Tasks**: Each 100 concurrent tasks requires approximately 1 worker

### Growth Projections

Plan for:

- 20% annual growth in users
- 30% annual growth in clients
- 50% annual growth in files
- 40% annual growth in tasks

## Maintenance Windows

Schedule maintenance during low-usage periods:

- **Daily**: 2:00 AM - 4:00 AM local time
- **Weekly**: Sunday 12:00 AM - 4:00 AM local time
- **Monthly**: Last Sunday of the month 12:00 AM - 6:00 AM local time

Notify users in advance:

- **Minor Maintenance**: 24 hours in advance
- **Major Maintenance**: 72 hours in advance
- **Emergency Maintenance**: As soon as possible