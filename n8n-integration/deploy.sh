#!/bin/bash

# n8n Integration Deployment Script
# This script helps deploy the n8n integration

# Set default values
N8N_HOST=${N8N_HOST:-localhost}
N8N_PORT=${N8N_PORT:-5678}
N8N_PROTOCOL=${N8N_PROTOCOL:-http}

# Display banner
echo "====================================================="
echo "  MarkoTronix HVAC CRM - n8n Integration Deployment"
echo "====================================================="
echo "N8N_HOST: $N8N_HOST"
echo "N8N_PORT: $N8N_PORT"
echo "N8N_PROTOCOL: $N8N_PROTOCOL"
echo "====================================================="

# Function to display help
show_help() {
  echo "Usage: ./deploy.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --start       Start the n8n integration"
  echo "  --stop        Stop the n8n integration"
  echo "  --restart     Restart the n8n integration"
  echo "  --status      Check the status of the n8n integration"
  echo "  --logs        View the logs of the n8n integration"
  echo "  --help        Display this help message"
  echo ""
  echo "Environment variables:"
  echo "  N8N_HOST      Hostname for n8n (default: localhost)"
  echo "  N8N_PORT      Port for n8n (default: 5678)"
  echo "  N8N_PROTOCOL  Protocol for n8n (default: http)"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh --start"
  echo "  N8N_PORT=8080 ./deploy.sh --restart"
  echo ""
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
  show_help
  exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Warning: .env file not found. Creating from .env.example..."
  cp .env.example .env
  echo "Please update the .env file with your configuration."
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --start)
      echo "Starting n8n integration..."
      docker-compose up -d
      echo "n8n integration started successfully!"
      echo "Access the n8n editor at $N8N_PROTOCOL://$N8N_HOST:$N8N_PORT"
      ;;
    --stop)
      echo "Stopping n8n integration..."
      docker-compose down
      echo "n8n integration stopped successfully!"
      ;;
    --restart)
      echo "Restarting n8n integration..."
      docker-compose restart
      echo "n8n integration restarted successfully!"
      echo "Access the n8n editor at $N8N_PROTOCOL://$N8N_HOST:$N8N_PORT"
      ;;
    --status)
      echo "Checking n8n integration status..."
      docker-compose ps
      ;;
    --logs)
      echo "Viewing n8n integration logs..."
      docker-compose logs -f
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
  shift
done