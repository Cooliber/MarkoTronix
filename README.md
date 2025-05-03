# HVAC CRM System

A comprehensive CRM system for HVAC businesses, including a Progressive Web App (PWA) frontend and a containerized backend.

## System Components

### Frontend (hvac-ui)

A Next.js Progressive Web Application with:

- **Dashboard**: View key metrics and quick actions
- **Client Management**: Add, edit, and view client profiles
- **Email & Transcription Handling**: Manage communications and convert audio to text
- **Offer Creation**: Create, edit, and send offers with AI-generated variants
- **Calendar & Kanban**: Schedule and track service appointments
- **Map View**: Visualize equipment locations and service areas
- **Inventory Management**: Track components and suppliers
- **Service Reports**: Generate and send service reports

### Backend (hvac-crm-system)

A Docker-based backend system with:

- **API Service**: FastAPI REST API
- **Worker Service**: Celery for background task processing
- **Database**: PostgreSQL (Supabase) for data storage
- **Cache & Message Broker**: Redis
- **Storage**: MinIO (S3-compatible) for file storage
- **Vector Database**: Qdrant for embeddings and similarity search
- **Reverse Proxy**: Nginx for routing and SSL termination
- **Monitoring**: Prometheus, Grafana, and Jaeger for observability
- **Workflow Automation**: n8n for integrations and automation

## Documentation

- [Architecture Overview](hvac-crm-system/docs/architecture.md)
- [User Guide](hvac-crm-system/docs/user-guide.md)
- [Developer Guide](hvac-crm-system/docs/dev-guide.md)
- [Operations Runbook](hvac-crm-system/docs/runbook.md)
- [Monitoring Guide](hvac-crm-system/docs/monitoring.md)

## Getting Started

### Frontend Setup

```bash
cd hvac-ui
cp .env.example .env
# Update the .env file with your API URL and other configuration
yarn install
yarn dev
```

### Backend Setup

```bash
cd hvac-crm-system
cp .env.example .env
# Update the .env file with your configuration
docker-compose up -d
./init.sh
```

## Features

- **Progressive Web App**: Install on desktop and mobile devices
- **Offline Functionality**: Work even without an internet connection
- **Real-time Updates**: See changes as they happen
- **AI-powered**: Automated email categorization, transcription, and offer generation
- **Mobile Optimized**: Responsive design for all device sizes
- **Integrated Mapping**: Visualize installations and optimize service routes
- **Comprehensive Reporting**: Generate and send professional reports
- **Scalable Architecture**: Designed to grow with your business

## License

This project is proprietary and confidential.