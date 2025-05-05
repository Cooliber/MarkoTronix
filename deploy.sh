#!/bin/bash

# Deployment script for HVAC CRM
# This script deploys the application to various platforms

# Exit on error
set -e

# Default values
PLATFORM=${1:-"sevilla"}

# Print usage information
function print_usage() {
  echo "Usage: $0 [PLATFORM] [OPTIONS]"
  echo "  PLATFORM: The deployment platform (default: sevilla)"
  echo "            Valid values: sevilla, nixpacks, docker, docker-compose, standalone"
  echo ""
  echo "Environment variables:"
  echo "  PORT           Port to expose the application (default: 28000)"
  echo "  API_URL        URL of the API (default: http://localhost:18000/api)"
  echo "  APP_ENV        Environment (development, production) (default: production)"
  echo ""
  echo "Examples:"
  echo "  $0 nixpacks"
  echo "  PORT=8080 API_URL=https://api.example.com/api $0 docker"
  echo "  $0 docker-compose standalone"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  print_usage
  exit 0
fi

# Default environment variables
export PORT=${PORT:-28000}
export API_URL=${API_URL:-http://localhost:18000/api}
export APP_ENV=${APP_ENV:-production}

# Validate platform
if [[ "$PLATFORM" != "sevilla" && "$PLATFORM" != "nixpacks" && "$PLATFORM" != "docker" && "$PLATFORM" != "docker-compose" && "$PLATFORM" != "standalone" ]]; then
  echo "Error: Invalid platform '$PLATFORM'"
  print_usage
  exit 1
fi

echo "Deploying to $PLATFORM..."

# Deploy to the specified platform
case "$PLATFORM" in
  "sevilla")
    echo "Deploying to Sevilla..."
    sevilla deploy --config ./sevilla.config.js
    ;;
  "nixpacks")
    echo "Deploying with Nixpacks..."
    nixpacks build . --config ./nixpacks.toml --name hvac-crm
    echo "Running the container..."
    docker run -p ${PORT:-28000}:3000 \
      -e NODE_ENV=production \
      -e NEXT_PUBLIC_API_URL=${API_URL:-http://localhost:18000/api} \
      -e API_URL=${API_URL:-http://localhost:18000/api} \
      -e APP_ENV=${APP_ENV:-production} \
      hvac-crm
    ;;
  "docker")
    echo "Building Docker image..."
    docker build -t hvac-crm-ui .
    echo "Running Docker container..."
    docker run -p ${PORT:-28000}:3000 \
      -e NODE_ENV=production \
      -e NEXT_PUBLIC_API_URL=${API_URL:-http://localhost:18000/api} \
      -e API_URL=${API_URL:-http://localhost:18000/api} \
      -e APP_ENV=${APP_ENV:-production} \
      hvac-crm-ui
    ;;
  "docker-compose")
    echo "Deploying with Docker Compose..."
    if [[ "$2" == "standalone" ]]; then
      docker-compose -f docker-compose.standalone.yml up -d
    else
      docker-compose up -d
    fi
    ;;
  "standalone")
    echo "Deploying with standalone Docker Compose..."
    docker-compose -f docker-compose.standalone.yml up -d
    ;;
esac

echo "Deployment to $PLATFORM completed successfully!"