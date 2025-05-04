#!/bin/bash

# Nixpacks deployment script
# This script builds and deploys the application using Nixpacks

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Nixpacks is installed
if ! command -v nixpacks &> /dev/null; then
  echo "Nixpacks is not installed. Installing..."
  curl -sSL https://nixpacks.com/install.sh | bash
fi

# Set environment
ENV=${1:-production}
echo "Deploying to $ENV environment"

# Copy appropriate environment file
if [ -f .env.$ENV ]; then
  echo "Using .env.$ENV file"
  cp .env.$ENV .env.production
else
  echo "Warning: .env.$ENV file not found, using default .env file"
  cp .env .env.production
fi

# Build the application with Nixpacks
echo "Building the application with Nixpacks..."
nixpacks build . --config ./deploy/nixpacks.toml --name hvac-crm-$ENV

# Run the container
echo "Running the container..."
docker run -d --name hvac-crm-$ENV -p 3000:3000 --env-file .env.production hvac-crm-$ENV

# Output deployment information
echo "Deployment complete!"
echo "Your application is running at: http://localhost:3000"
echo "Container ID: $(docker ps -q -f name=hvac-crm-$ENV)"

echo "Deployment script completed successfully!"