# HVAC CRM System

A comprehensive CRM system for HVAC businesses, featuring client management, email handling, transcription processing, offer generation, service scheduling, and inventory management.

## System Architecture

The HVAC CRM System is built using a microservices architecture with the following components:

- **API Service**: FastAPI-based REST API
- **Worker Service**: Celery for background task processing
- **Database**: PostgreSQL (Supabase) for data storage
- **Cache & Message Broker**: Redis
- **Storage**: MinIO (S3-compatible)
- **Vector Database**: Qdrant for embeddings and similarity search
- **Reverse Proxy**: Nginx
- **Email Testing**: MailHog (development only)
- **Monitoring**: Prometheus, Grafana, Jaeger
- **Workflow Automation**: n8n

## Features

- **Client Management**: Store and manage client information, including contact details and installation records
- **Email Handling**: Process incoming emails, categorize them, and generate response suggestions
- **Transcription Processing**: Convert audio recordings to text for easier processing
- **Offer Generation**: Create and manage offers with multiple packages, using AI to generate suggestions
- **Service Scheduling**: Schedule and track service appointments, with technician assignment and reporting
- **Inventory Management**: Track components, suppliers, and orders
- **Dashboard**: View key metrics and upcoming tasks
- **User Authentication**: Secure JWT-based authentication
- **Monitoring & Observability**: Track system performance and troubleshoot issues

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hvac-crm-system.git
   cd hvac-crm-system
   ```

2. Run the initialization script:
   ```bash
   ./init.sh
   ```

   This script will:
   - Create necessary configuration files
   - Start all Docker containers
   - Set up MinIO buckets
   - Run database migrations
   - Seed initial data

3. Access the services:
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001
   - MailHog: http://localhost:8025
   - Flower: http://localhost:5555
   - RedisInsight: http://localhost:8001
   - n8n: http://localhost:5678
   - Grafana: http://localhost:3000
   - Jaeger: http://localhost:16686

### Configuration

The system is configured using environment variables. Copy the `.env.example` file to `.env` and update the values as needed:

```bash
cp .env.example .env
```

## Development

### API Service

The API service is built with FastAPI and provides the following endpoints:

- `/auth`: Authentication endpoints
- `/clients`: Client management
- `/emails`: Email processing
- `/transcriptions`: Audio transcription
- `/offers`: Offer management
- `/services`: Service scheduling
- `/inventory`: Inventory management
- `/dashboard`: Dashboard metrics

### Worker Service

The worker service uses Celery to process background tasks such as:

- Email processing
- Transcription generation
- AI-based offer package generation
- Report generation
- Notification sending

### Database Schema

The database schema includes the following main entities:

- Users
- Clients
- Installations
- Emails
- Transcriptions
- Offers
- Services
- Service Reports
- Suppliers
- Components
- Orders

## Monitoring

The system includes comprehensive monitoring:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Jaeger**: Distributed tracing

## Documentation

- API Documentation: Available at `/docs` endpoint
- User Guide: See `docs/user-guide.md`
- Developer Guide: See `docs/dev-guide.md`
- Architecture: See `docs/architecture.md`
- Runbook: See `docs/runbook.md`

## License

This project is licensed under the MIT License - see the LICENSE file for details.