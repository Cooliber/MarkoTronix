# HVAC CRM System Architecture

This document describes the architecture of the HVAC CRM system, including the components, data flow, and integration points.

## System Overview

The HVAC CRM system is built using a microservices architecture with the following components:

1. **Frontend (UI)**: Next.js Progressive Web App
2. **API Service**: FastAPI REST API
3. **Worker Service**: Celery for background task processing
4. **Database**: PostgreSQL (Supabase) for data storage
5. **Cache & Message Broker**: Redis
6. **Storage**: MinIO (S3-compatible) for file storage
7. **Vector Database**: Qdrant for embeddings and similarity search
8. **Reverse Proxy**: Nginx for routing and SSL termination
9. **Monitoring**: Prometheus, Grafana, and Jaeger for observability
10. **Workflow Automation**: n8n for integrations and automation

## Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │ Mobile App  │     │ Telegram Bot│
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────┬───────┴───────────┬──────┘
                   │                   │
                   ▼                   ▼
┌─────────────────────────────────────────────┐
│                   Nginx                      │
└─────────────────────┬─────────────────────┬─┘
                      │                     │
┌─────────────────────▼─────┐   ┌───────────▼─────────┐
│        Frontend           │   │        API Service   │
│      (Next.js PWA)        │   │        (FastAPI)     │
└─────────────────────┬─────┘   └───────────┬─────────┘
                      │                     │
                      │                     ▼
                      │         ┌─────────────────────┐
                      │         │    Worker Service   │
                      │         │      (Celery)       │
                      │         └───┬───────────┬─────┘
                      │             │           │
                      │             ▼           ▼
┌─────────────────────▼─────┐   ┌───────────────────────┐
│         Redis             │   │      PostgreSQL        │
│  (Cache & Message Broker) │   │      (Supabase)        │
└───────────────────────────┘   └───────────────────────┘
                                           │
                      ┌─────────────┬──────┴──────┬─────────────┐
                      │             │             │             │
                      ▼             ▼             ▼             ▼
              ┌──────────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────┐
              │    MinIO     │ │ Qdrant  │ │    n8n      │ │ Jaeger  │
              │  (Storage)   │ │ (Vector │ │ (Workflow   │ │(Tracing)│
              └──────────────┘ │   DB)   │ │ Automation) │ └─────────┘
                               └─────────┘ └─────────────┘
```

## Component Details

### 1. Frontend (UI)

- **Technology**: Next.js, Chakra UI, Framer Motion
- **Features**:
  - Progressive Web App (PWA) for desktop and mobile
  - Responsive design
  - Offline functionality
  - Push notifications
  - Client-side caching
- **Integration Points**:
  - Communicates with API Service via REST API
  - Stores authentication tokens in local storage
  - Caches data for offline use

### 2. API Service

- **Technology**: FastAPI, SQLAlchemy, Pydantic
- **Features**:
  - REST API endpoints for all CRUD operations
  - JWT authentication
  - Request validation
  - API documentation (Swagger UI)
  - Metrics and tracing
- **Integration Points**:
  - Connects to PostgreSQL for data storage
  - Enqueues tasks to Redis for worker processing
  - Stores files in MinIO
  - Stores and retrieves embeddings from Qdrant

### 3. Worker Service

- **Technology**: Celery, Redis
- **Features**:
  - Background task processing
  - Scheduled tasks
  - Retry mechanism for failed tasks
  - Task prioritization
- **Integration Points**:
  - Receives tasks from Redis
  - Connects to PostgreSQL for data access
  - Stores files in MinIO
  - Integrates with external services (OpenAI, Twilio, etc.)

### 4. Database (PostgreSQL/Supabase)

- **Technology**: PostgreSQL, Supabase
- **Features**:
  - Relational database for structured data
  - Real-time updates via Supabase
  - Authentication and authorization
  - Row-level security
- **Integration Points**:
  - Accessed by API Service and Worker Service
  - Provides data for frontend via API

### 5. Cache & Message Broker (Redis)

- **Technology**: Redis
- **Features**:
  - Message broker for Celery tasks
  - Caching for frequently accessed data
  - Rate limiting
  - Session storage
- **Integration Points**:
  - Used by API Service for caching
  - Used by Worker Service for task queue
  - Used for distributed locking

### 6. Storage (MinIO)

- **Technology**: MinIO (S3-compatible)
- **Features**:
  - Object storage for files
  - Versioning
  - Access control
  - Lifecycle policies
- **Integration Points**:
  - Stores files uploaded via API
  - Provides files for download via API
  - Used by Worker Service for processing files

### 7. Vector Database (Qdrant)

- **Technology**: Qdrant
- **Features**:
  - Vector database for embeddings
  - Similarity search
  - Filtering and faceting
- **Integration Points**:
  - Stores embeddings generated by Worker Service
  - Provides search results for API Service

### 8. Reverse Proxy (Nginx)

- **Technology**: Nginx
- **Features**:
  - Routing
  - SSL termination
  - Load balancing
  - Rate limiting
  - Caching
- **Integration Points**:
  - Routes requests to appropriate services
  - Serves static files
  - Handles SSL/TLS

### 9. Monitoring

- **Technology**: Prometheus, Grafana, Jaeger
- **Features**:
  - Metrics collection and visualization
  - Distributed tracing
  - Alerting
  - Dashboards
- **Integration Points**:
  - Collects metrics from all services
  - Provides dashboards for monitoring
  - Sends alerts for issues

### 10. Workflow Automation (n8n)

- **Technology**: n8n
- **Features**:
  - Workflow automation
  - Integration with external services
  - Webhooks
  - Scheduled workflows
- **Integration Points**:
  - Integrates with API Service
  - Connects to external services (Twilio, Slack, etc.)
  - Triggers workflows based on events

## Data Flow

### Client Management Flow

1. User creates a new client via the frontend
2. Frontend sends client data to API Service
3. API Service validates the data and stores it in PostgreSQL
4. API Service returns the created client to the frontend
5. Worker Service may process additional tasks (e.g., sending welcome email)

### Email Processing Flow

1. Email is received by the system
2. API Service creates a record in PostgreSQL
3. API Service enqueues a task for the Worker Service
4. Worker Service processes the email (categorization, extraction, etc.)
5. Worker Service updates the email record in PostgreSQL
6. Frontend displays the processed email to the user

### Offer Generation Flow

1. User requests offer generation via the frontend
2. Frontend sends request to API Service
3. API Service enqueues a task for the Worker Service
4. Worker Service generates offer packages using AI
5. Worker Service stores the generated offers in PostgreSQL
6. Frontend displays the generated offers to the user
7. User can edit and send the offer to the client

### Service Scheduling Flow

1. User schedules a service appointment via the frontend
2. Frontend sends appointment data to API Service
3. API Service validates the data and stores it in PostgreSQL
4. API Service returns the created appointment to the frontend
5. Worker Service sends notifications to relevant parties
6. Technician receives notification and updates status via mobile app
7. Status updates are stored in PostgreSQL and displayed in real-time

## Security

### Authentication

- JWT-based authentication
- Refresh tokens for extended sessions
- Role-based access control
- API key authentication for service-to-service communication

### Data Protection

- Encryption at rest for sensitive data
- TLS for all communications
- Row-level security in PostgreSQL
- Access control for MinIO buckets

### Monitoring and Auditing

- Audit logs for all operations
- Monitoring for suspicious activities
- Rate limiting to prevent abuse
- Regular security scans

## Scalability

The system is designed to scale horizontally:

- Stateless API Service can be scaled with multiple instances
- Worker Service can be scaled with multiple workers
- Redis and PostgreSQL can be clustered for high availability
- MinIO can be deployed in distributed mode
- Nginx can load balance across multiple instances

## Deployment

The system is deployed using Docker Compose for development and testing. For production, it can be deployed to:

- Kubernetes cluster
- Cloud provider (AWS, GCP, Azure)
- On-premises infrastructure

## Future Enhancements

- **Multi-tenancy**: Support for multiple organizations
- **AI Enhancements**: More AI-powered features for automation
- **Mobile App**: Native mobile app for technicians
- **Integration Marketplace**: More integrations with third-party services
- **Advanced Analytics**: Business intelligence and reporting
- **Internationalization**: Support for multiple languages and regions