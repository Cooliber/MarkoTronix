# HVAC CRM Deployment Guide

This document provides detailed instructions for deploying the HVAC CRM application using various methods.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Methods](#deployment-methods)
   - [Standard Deployment](#standard-deployment)
   - [Docker Deployment](#docker-deployment)
   - [Docker Compose Deployment](#docker-compose-deployment)
   - [Nixpacks Deployment](#nixpacks-deployment)
   - [Sevilla Deployment](#sevilla-deployment)
4. [Continuous Integration/Continuous Deployment](#continuous-integrationcontinuous-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the HVAC CRM application, ensure you have the following:

- Node.js 18 or later
- npm or yarn
- Docker (for containerized deployments)
- Nixpacks (for Nixpacks deployment)
- Sevilla CLI (for Sevilla deployment)
- Git

## Environment Configuration

The application requires proper environment configuration for deployment. Several environment files are provided:

- `.env.example`: Template with all available environment variables
- `.env.development`: Development environment configuration
- `.env.production`: Production environment configuration
- `.env.sevilla`: Sevilla-specific environment configuration

Before deployment, copy the appropriate environment file to `.env.production`:

```bash
# For standard production deployment
cp .env.example .env.production
# Edit .env.production with your specific values

# For Sevilla deployment
cp .env.sevilla .env.production
# Edit .env.production with your specific values
```

## Deployment Methods

### Standard Deployment

For a standard Node.js deployment:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

### Docker Deployment

For Docker-based deployment:

```bash
# Build the Docker image
npm run docker:build

# Run the Docker container
npm run docker:run
```

Alternatively, you can use Docker commands directly:

```bash
# Build the Docker image
docker build -t hvac-crm-ui .

# Run the Docker container
docker run -p 3000:3000 --env-file .env.production hvac-crm-ui
```

### Docker Compose Deployment

For deployment with Docker Compose (includes n8n for workflow automation):

```bash
# Start all services
npm run docker:compose

# Stop all services
npm run docker:compose:down
```

Alternatively, you can use Docker Compose commands directly:

```bash
# Start all services
docker-compose -f ./deploy/docker-compose.yml up -d

# Stop all services
docker-compose -f ./deploy/docker-compose.yml down
```

### Nixpacks Deployment

For deployment with Nixpacks:

```bash
# Deploy with Nixpacks
npm run deploy:nixpacks
```

Alternatively, you can use Nixpacks commands directly:

```bash
# Build with Nixpacks
nixpacks build . --config ./deploy/nixpacks.toml --name hvac-crm

# Run the container
docker run -p 3000:3000 --env-file .env.production hvac-crm
```

### Sevilla Deployment

For deployment to Sevilla platform:

```bash
# Deploy to Sevilla
npm run deploy:sevilla
```

Alternatively, you can use Sevilla CLI commands directly:

```bash
# Login to Sevilla
sevilla login

# Deploy to Sevilla
sevilla deploy --config ./deploy/sevilla.config.js
```

## Continuous Integration/Continuous Deployment

The repository includes GitHub Actions workflows for automated deployment:

- `deploy-to-sevilla.yml`: Deploys to Sevilla platform
- `deploy-with-nixpacks.yml`: Builds with Nixpacks and deploys to a server

These workflows are triggered on push to specific branches or manually through the GitHub Actions interface.

### GitHub Secrets

For the GitHub Actions workflows to work properly, you need to set up the following secrets:

- `SEVILLA_TOKEN`: Sevilla API token for authentication
- `DEPLOY_HOST`: Hostname for server deployment
- `DEPLOY_USER`: Username for server deployment
- `DEPLOY_SSH_KEY`: SSH key for server deployment

## Post-Deployment Verification

After deployment, verify that the application is running correctly:

1. Check the health endpoint: `https://your-domain.com/api/health`
2. Verify that the application loads correctly in a web browser
3. Test key functionality (login, dashboard, etc.)
4. Check that the WebSocket connection works
5. Verify that n8n integration works (if applicable)

## Troubleshooting

If you encounter issues during deployment, check the following:

- Verify that all environment variables are set correctly
- Check the application logs for errors
- Ensure that all required services are running
- Verify that the application has the necessary permissions
- Check that the network configuration allows the required connections

For specific issues, refer to the error messages in the logs and consult the relevant documentation.