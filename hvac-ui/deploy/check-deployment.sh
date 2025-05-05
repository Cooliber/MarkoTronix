#!/bin/bash

# Deployment status check script
# This script checks the status of a deployment

# Exit on error
set -e

# Default values
URL=${1:-"http://localhost:28000"}
TIMEOUT=${2:-30}
INTERVAL=${3:-5}

# Print usage information
function print_usage() {
  echo "Usage: $0 [URL] [TIMEOUT] [INTERVAL]"
  echo "  URL: The URL to check (default: http://localhost:28000)"
  echo "  TIMEOUT: Maximum time to wait in seconds (default: 30)"
  echo "  INTERVAL: Time between checks in seconds (default: 5)"
  echo ""
  echo "Example: $0 https://hvac-crm.example.com 60 10"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  print_usage
  exit 0
fi

echo "Checking deployment status at $URL"
echo "Timeout: $TIMEOUT seconds"
echo "Interval: $INTERVAL seconds"

# Start timer
START_TIME=$(date +%s)
END_TIME=$((START_TIME + TIMEOUT))

# Check health endpoint
HEALTH_URL="$URL/api/health"
echo "Checking health endpoint: $HEALTH_URL"

# Loop until timeout
while [ $(date +%s) -lt $END_TIME ]; do
  # Calculate elapsed time
  ELAPSED=$(($(date +%s) - START_TIME))
  
  echo "[$ELAPSED/$TIMEOUT seconds] Checking deployment status..."
  
  # Check if the health endpoint is accessible
  if curl -s -f -o /dev/null "$HEALTH_URL"; then
    echo "Deployment is up and running!"
    
    # Get detailed health information
    echo "Health information:"
    curl -s "$HEALTH_URL" | json_pp
    
    # Check main page
    echo "Checking main page..."
    if curl -s -f -o /dev/null "$URL"; then
      echo "Main page is accessible!"
      exit 0
    else
      echo "Warning: Main page is not accessible, but health endpoint is working."
      exit 1
    fi
  fi
  
  # Wait before next check
  echo "Deployment not ready yet, waiting $INTERVAL seconds..."
  sleep $INTERVAL
done

# If we get here, the deployment didn't come up within the timeout
echo "Error: Deployment did not become available within $TIMEOUT seconds."
echo "Last response from health endpoint:"
curl -s "$HEALTH_URL" || echo "No response"
exit 1