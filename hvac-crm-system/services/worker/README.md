# HVAC CRM Worker Service

This service handles background tasks for the HVAC CRM system using Celery with Redis as the message broker.

## Features

- **Email Processing**: Parse and categorize incoming emails
- **Transcription Generation**: Convert audio recordings to text
- **Offer Generation**: Use AI to generate offer packages based on client requirements
- **Report Generation**: Create PDF reports for service visits
- **Notification Sending**: Send SMS, email, and push notifications
- **Data Synchronization**: Keep data in sync across services

## Architecture

The worker service is built with:

- **Celery**: Distributed task queue
- **Redis**: Message broker and result backend
- **OpenAI**: AI-powered text generation and classification
- **Supabase**: Database access
- **MinIO**: S3-compatible storage for files
- **Qdrant**: Vector database for semantic search

## Task Queues

The service uses multiple queues to prioritize different types of tasks:

- **high_priority**: Critical tasks that need immediate processing (notifications, etc.)
- **default**: Standard tasks (email processing, report generation, etc.)
- **low_priority**: Background tasks that can be delayed (data synchronization, cleanup, etc.)

## Task Definitions

### Email Processing

```python
@celery_app.task(name="process_email")
def process_email(email_id: int):
    """
    Process an incoming email:
    1. Categorize (client inquiry, spam, etc.)
    2. Extract key information
    3. Generate response suggestions
    4. Create follow-up tasks if needed
    """
    # Implementation details...
```

### Transcription Generation

```python
@celery_app.task(name="generate_transcription")
def generate_transcription(audio_file_id: int):
    """
    Convert audio recording to text:
    1. Download audio file from storage
    2. Use speech-to-text API to generate transcription
    3. Save transcription to database
    4. Create follow-up tasks for processing the transcription
    """
    # Implementation details...
```

### Offer Generation

```python
@celery_app.task(name="generate_offer_packages")
def generate_offer_packages(client_id: int, requirements: dict):
    """
    Generate offer packages based on client requirements:
    1. Retrieve client information
    2. Use AI to generate multiple package options
    3. Calculate pricing for each package
    4. Save packages to database
    """
    # Implementation details...
```

### Report Generation

```python
@celery_app.task(name="generate_service_report")
def generate_service_report(service_id: int):
    """
    Generate a service report:
    1. Retrieve service information
    2. Create PDF report
    3. Save report to storage
    4. Send report to client
    """
    # Implementation details...
```

### Notification Sending

```python
@celery_app.task(name="send_notification")
def send_notification(user_id: int, notification_type: str, data: dict):
    """
    Send a notification:
    1. Retrieve user preferences
    2. Format notification based on type
    3. Send via appropriate channel (email, SMS, push)
    4. Record notification in database
    """
    # Implementation details...
```

## Scheduled Tasks

The worker service also includes scheduled tasks that run periodically:

- **Daily email digest**: Send a summary of new leads and pending tasks
- **Weekly performance report**: Generate and send performance metrics
- **Monthly client follow-up**: Identify clients who haven't been contacted recently
- **Database maintenance**: Clean up old data, optimize tables, etc.

## Error Handling

Tasks are configured with retry policies to handle transient errors:

```python
@celery_app.task(
    name="process_email",
    bind=True,
    max_retries=3,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def process_email(self, email_id: int):
    try:
        # Task implementation...
    except (ConnectionError, TimeoutError) as exc:
        # Retry for network-related errors
        self.retry(exc=exc)
    except Exception as exc:
        # Log unexpected errors
        logger.error(f"Error processing email {email_id}: {exc}")
        raise
```

## Monitoring

The worker service is monitored using:

- **Flower**: Web-based Celery monitoring tool
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Jaeger**: Distributed tracing

## Development

### Prerequisites

- Python 3.9+
- Redis
- Docker and Docker Compose (for local development)

### Setup

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables (see `.env.example`)
4. Start the worker: `celery -A app.worker worker --loglevel=info`

### Testing

Run tests with pytest:

```bash
pytest tests/
```

## Deployment

The worker service is deployed as a Docker container. See the `Dockerfile` for details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.