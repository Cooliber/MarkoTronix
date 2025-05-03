# HVAC CRM Deployment

This directory contains deployment configurations and scripts for the HVAC CRM application.

## Directory Structure

- `sevilla.config.js`: Configuration file for Sevilla deployment platform
- `nixpacks.toml`: Configuration file for Nixpacks deployment
- `docker-compose.yml`: Docker Compose configuration for local development and testing
- `deploy-to-sevilla.sh`: Script to deploy the application to Sevilla
- `deploy-with-nixpacks.sh`: Script to deploy the application with Nixpacks
- `setup-environment.sh`: Script to set up a new environment
- `check-deployment.sh`: Script to check the status of a deployment
- `generate-config.sh`: Script to generate deployment configuration files
- `DEPLOYMENT.md`: Detailed deployment guide

## Quick Start

### Setting Up a New Environment

```bash
# Set up a development environment
./setup-environment.sh development

# Set up a production environment
./setup-environment.sh production

# Set up a Sevilla environment
./setup-environment.sh sevilla
```

### Deploying to Sevilla

```bash
# Deploy to Sevilla
./deploy-to-sevilla.sh
```

### Deploying with Nixpacks

```bash
# Deploy with Nixpacks
./deploy-with-nixpacks.sh
```

### Checking Deployment Status

```bash
# Check deployment status
./check-deployment.sh https://your-domain.com 60 5
```

### Generating Configuration Files

```bash
# Generate all configuration files
./generate-config.sh all

# Generate Sevilla configuration
./generate-config.sh sevilla

# Generate Nixpacks configuration
./generate-config.sh nixpacks

# Generate Docker configuration
./generate-config.sh docker

# Generate Docker Compose configuration
./generate-config.sh docker-compose
```

## Environment Variables

The application requires the following environment variables:

- `NODE_ENV`: Node.js environment (development, production)
- `APP_ENV`: Application environment (development, staging, production)
- `NEXT_PUBLIC_APP_ENV`: Public application environment (development, staging, production)
- `NEXT_PUBLIC_API_URL`: URL of the API
- `NEXT_PUBLIC_WEBSOCKET_URL`: URL of the WebSocket server
- `NEXT_PUBLIC_N8N_URL`: URL of the n8n server
- `NEXT_PUBLIC_ENABLE_N8N_INTEGRATION`: Enable n8n integration (true, false)

For a complete list of environment variables, see `.env.example` in the root directory.

## Deployment Platforms

### Sevilla

Sevilla is a deployment platform that provides a simple way to deploy applications. The application is deployed to Sevilla using the `deploy-to-sevilla.sh` script.

### Nixpacks

Nixpacks is a tool that builds Docker images from source code. The application is deployed with Nixpacks using the `deploy-with-nixpacks.sh` script.

### Docker

The application can be deployed with Docker using the Dockerfile in the root directory.

### Docker Compose

The application can be deployed with Docker Compose using the `docker-compose.yml` file in this directory.

## Continuous Integration/Continuous Deployment

The repository includes GitHub Actions workflows for automated deployment:

- `deploy-to-sevilla.yml`: Deploys to Sevilla platform
- `deploy-with-nixpacks.yml`: Builds with Nixpacks and deploys to a server

These workflows are triggered on push to specific branches or manually through the GitHub Actions interface.

## Further Reading

For more detailed information, see the [DEPLOYMENT.md](./DEPLOYMENT.md) file.