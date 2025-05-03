#!/bin/bash

# Deployment script for HVAC CRM
# This script deploys the application to various platforms

# Exit on error
set -e

# Default values
PLATFORM=${1:-"sevilla"}

# Print usage information
function print_usage() {
  echo "Usage: $0 [PLATFORM]"
  echo "  PLATFORM: The deployment platform (default: sevilla)"
  echo "            Valid values: sevilla, nixpacks, docker, docker-compose"
  echo ""
  echo "Example: $0 nixpacks"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  print_usage
  exit 0
fi

# Validate platform
if [[ "$PLATFORM" != "sevilla" && "$PLATFORM" != "nixpacks" && "$PLATFORM" != "docker" && "$PLATFORM" != "docker-compose" ]]; then
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
    docker run -p 3000:3000 --env-file .env hvac-crm
    ;;
  "docker")
    echo "Building Docker image..."
    docker build -t hvac-crm-ui .
    echo "Running Docker container..."
    docker run -p 3000:3000 --env-file .env hvac-crm-ui
    ;;
  "docker-compose")
    echo "Deploying with Docker Compose..."
    docker-compose up -d
    ;;
esac

echo "Deployment to $PLATFORM completed successfully!"