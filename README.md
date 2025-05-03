# MarkoTronix HVAC CRM System

A comprehensive CRM system for HVAC businesses, including a Progressive Web App (PWA) frontend with GSAP animations and a containerized backend.

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
- **Warranty Management**: Issue and track warranty cards
- **Service Order Tracking**: Real-time monitoring of service order status
- **Mobile-Optimized Interface**: Responsive design with dedicated mobile layouts
- **GSAP Animations**: Smooth transitions and interactive elements
- **Multi-language Support**: English and Polish interfaces

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

### Prerequisites

- Node.js 18+
- Yarn or npm
- Docker (optional, for containerized deployment)

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

## Building for Production

### Standard Build

```bash
cd hvac-ui
yarn build
yarn start
```

### Docker Build

```bash
cd hvac-ui
yarn build:docker
docker run -p 3000:3000 hvac-ui
```

### Using Docker Compose

```bash
docker-compose up -d
```

### Deployment with Nixpack

This project is configured to work with Nixpack for easy deployment:

```bash
nixpacks build ./hvac-ui -n hvac-ui
```

## Environment Variables

See `.env.example` for all available environment variables. The most important ones are:

- `API_URL`: URL of the backend API
- `APP_ENV`: Application environment (development, production)
- `PORT`: Port to run the application on
- `HOST`: Host to bind the application to

## Features

- **Progressive Web App**: Install on desktop and mobile devices
- **Offline Functionality**: Work even without an internet connection
- **Real-time Updates**: See changes as they happen
- **AI-powered**: Automated email categorization, transcription, and offer generation
- **Mobile Optimized**: Responsive design for all device sizes
- **Integrated Mapping**: Visualize installations and optimize service routes
- **Comprehensive Reporting**: Generate and send professional reports
- **Scalable Architecture**: Designed to grow with your business
- **GSAP Animations**: Smooth transitions and interactive elements
- **Multi-language Support**: English and Polish interfaces
- **Responsive Design**: Optimized for all screen sizes
- **n8n Workflow Integration**: Automated business processes

## License

This project is proprietary and confidential.