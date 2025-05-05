#!/bin/bash

# Sevilla deployment script
# This script deploys the application to Sevilla platform

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Sevilla CLI is installed
if ! command -v sevilla &> /dev/null; then
  echo "Sevilla CLI is not installed. Installing..."
  npm install -g @sevilla/cli
fi

# Login to Sevilla
if [ -z "$SEVILLA_TOKEN" ]; then
  echo "SEVILLA_TOKEN is not set. Please login manually."
  sevilla login
else
  echo "Logging in to Sevilla using token..."
  sevilla login --token "$SEVILLA_TOKEN"
fi

# Build the application
echo "Building the application..."
npm run build

# Deploy to Sevilla
echo "Deploying to Sevilla..."
sevilla deploy --config ./deploy/sevilla.config.js

# Output deployment URL
echo "Deployment complete!"
echo "Your application is available at: $(sevilla info --name hvac-crm --output url)"

# Cleanup
echo "Cleaning up..."
rm -rf .sevilla-tmp

echo "Deployment script completed successfully!"