#!/bin/bash

# Environment setup script
# This script sets up a new environment for the HVAC CRM application

# Exit on error
set -e

# Default values
ENV=${1:-"development"}

# Print usage information
function print_usage() {
  echo "Usage: $0 [ENVIRONMENT]"
  echo "  ENVIRONMENT: The environment to set up (default: development)"
  echo "               Valid values: development, staging, production, sevilla"
  echo ""
  echo "Example: $0 production"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  print_usage
  exit 0
fi

# Validate environment
if [[ "$ENV" != "development" && "$ENV" != "staging" && "$ENV" != "production" && "$ENV" != "sevilla" ]]; then
  echo "Error: Invalid environment '$ENV'"
  print_usage
  exit 1
fi

echo "Setting up $ENV environment..."

# Create environment file
if [ -f ".env.$ENV" ]; then
  echo "Using existing .env.$ENV file"
  cp .env.$ENV .env
else
  echo "Creating .env.$ENV file from .env.example"
  cp .env.example .env.$ENV
  cp .env.example .env
  
  # Update environment-specific values
  case "$ENV" in
    "development")
      sed -i 's/APP_ENV=.*/APP_ENV=development/' .env
      sed -i 's/NEXT_PUBLIC_APP_ENV=.*/NEXT_PUBLIC_APP_ENV=development/' .env
      sed -i 's/NODE_ENV=.*/NODE_ENV=development/' .env
      ;;
    "staging")
      sed -i 's/APP_ENV=.*/APP_ENV=staging/' .env
      sed -i 's/NEXT_PUBLIC_APP_ENV=.*/NEXT_PUBLIC_APP_ENV=staging/' .env
      sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
      ;;
    "production")
      sed -i 's/APP_ENV=.*/APP_ENV=production/' .env
      sed -i 's/NEXT_PUBLIC_APP_ENV=.*/NEXT_PUBLIC_APP_ENV=production/' .env
      sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
      ;;
    "sevilla")
      cp .env.sevilla .env
      ;;
  esac
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application for $ENV environment..."
case "$ENV" in
  "development")
    # No build needed for development
    ;;
  "sevilla")
    npm run build:sevilla
    ;;
  *)
    npm run build
    ;;
esac

echo "$ENV environment setup complete!"
echo ""
echo "To start the application, run:"
case "$ENV" in
  "development")
    echo "  npm run dev"
    ;;
  "sevilla")
    echo "  npm run start:sevilla"
    ;;
  *)
    echo "  npm start"
    ;;
esac