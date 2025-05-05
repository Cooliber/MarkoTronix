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

### Backend Services

A Docker-based backend system with:

- **API Service (hvac-crm-system/services/api)**: FastAPI REST API for core functionality
- **Worker Service (hvac-crm-system/services/worker)**: Celery for background task processing
- **Mail Ingest Service (mail-ingest-service)**: Automated email processing and attachment handling
- **Offer Generation Service (offer-generation)**: AI-powered offer creation and PDF generation
- **Link Service (link-service)**: Shareable links and e-signature integration
- **Database**: PostgreSQL for local development, Supabase for production
- **Cache & Message Broker**: Redis
- **Storage**: Local file system for development, Supabase Storage for production
- **Monitoring**: Prometheus, Grafana, and Jaeger for observability

## Documentation

- [Architecture Overview](hvac-crm-system/docs/architecture.md)
- [User Guide](hvac-crm-system/docs/user-guide.md)
- [Developer Guide](hvac-crm-system/docs/dev-guide.md)
- [Operations Runbook](hvac-crm-system/docs/runbook.md)
- [Monitoring Guide](hvac-crm-system/docs/monitoring.md)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker and Docker Compose
- Supabase account (for production)

### Frontend Setup

```bash
cd hvac-ui
cp .env.example .env
# Update the .env file with your API URL and other configuration
npm install
npm run dev
```

### Backend Setup

```bash
# Set up environment files for each service
cp hvac-crm-system/.env.example hvac-crm-system/.env
cp mail-ingest-service/.env.example mail-ingest-service/.env
cp offer-generation/.env.example offer-generation/.env
cp link-service/.env.example link-service/.env

# Update the .env files with your configuration
# Start all services
docker-compose up -d
```

## Microservices Architecture

The system uses a microservices architecture with the following components:

### Mail Ingest Service

- **Purpose**: Automatically fetch and process emails
- **Features**:
  - IMAP integration for email fetching
  - Attachment extraction and storage
  - Email categorization and routing
  - Webhook endpoint for external email forwarding

### Offer Generation Service

- **Purpose**: Create and manage customer offers
- **Features**:
  - AI-powered offer content generation
  - PDF generation with customizable templates
  - Offer versioning and tracking
  - Integration with email service for delivery

### Link Service

- **Purpose**: Generate shareable links and handle e-signatures
- **Features**:
  - Secure link generation for offers and documents
  - Integration with e-signature providers (DocuSign, HelloSign)
  - Signature status tracking
  - Webhook endpoints for signature events

## Supabase Integration

The system is designed to work with Supabase for production environments:

- **Database**: PostgreSQL database hosted on Supabase
- **Storage**: Supabase Storage for file storage (attachments, PDFs, etc.)
- **Authentication**: Supabase Auth for user authentication
- **Realtime**: Supabase Realtime for live updates

Each service can be configured to use its own Supabase project for isolation and security.

## Building for Production

### Standard Build

```bash
# From the root directory
npm run build
npm start

# Or from the hvac-ui directory
cd hvac-ui
npm run build
npm start
```

### Docker Build

```bash
# From the root directory
docker build -t hvac-crm-ui .
docker run -p 3000:3000 --env-file .env hvac-crm-ui

# Or using npm scripts
npm run docker:build
npm run docker:run
```

### Using Docker Compose

```bash
# From the root directory
docker-compose up -d

# Or using standalone mode (frontend only)
docker-compose -f docker-compose.standalone.yml up -d

# Or using npm scripts
npm run docker:compose
```

### Deployment with Nixpacks

This project is configured to work with Nixpacks for easy deployment:

```bash
# From the root directory
nixpacks build . --name hvac-crm

# Or using npm scripts
npm run deploy:nixpacks
```

### Deployment to Sevilla

```bash
# From the root directory
./deploy.sh sevilla

# Or using npm scripts
npm run deploy:sevilla
```

## Environment Variables

See `.env.example` files in each service directory for all available environment variables.

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
- **Workflow Automation**: Integrated business process automation
- **Email Processing**: Automated email handling and response
- **Offer Generation**: AI-powered offer creation and PDF generation
- **E-Signature Integration**: DocuSign and HelloSign integration

## License

This project is proprietary and confidential.