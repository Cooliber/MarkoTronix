#!/bin/bash

# Script to upgrade Python dependencies in requirements.txt files
# This script uses pip-compile from pip-tools to upgrade dependencies

# Exit on error
set -e

# Directories containing requirements.txt files
SERVICES=(
    "mail-ingest-service"
    "offer-generation"
    "link-service"
)

# Install pip-tools if not already installed
pip install pip-tools

# Function to update requirements for a service
update_requirements() {
    local service_dir="$1"
    local req_file="${service_dir}/requirements.txt"
    local temp_file="${service_dir}/requirements.in"
    
    echo "Updating requirements for ${service_dir}..."
    
    # Create a temporary input file
    grep -v "^#" "${req_file}" | sed -E 's/([a-zA-Z0-9_\-\.]+)(>=.+|==.+|<=.+|~=.+|>.+|<.+)?/\1/' > "${temp_file}"
    
    # Special case for hellosign-python-sdk
    sed -i 's/^hellosign-python-sdk$/hellosign-python-sdk==5.2.0/' "${temp_file}"
    
    # Special case for httpx
    sed -i 's/^httpx$/httpx>=0.23.0,<0.24.0/' "${temp_file}"
    
    # Run pip-compile to generate updated requirements
    pip-compile --output-file="${req_file}" --upgrade --no-header "${temp_file}"
    
    # Add back the special case comments
    sed -i 's/hellosign-python-sdk==5.2.0/hellosign-python-sdk==5.2.0  # Updated to latest version/' "${req_file}"
    sed -i 's/httpx>=0.23.0,<0.24.0/httpx>=0.23.0,<0.24.0  # Keep this version for supabase compatibility/' "${req_file}"
    
    # Clean up
    rm "${temp_file}"
    
    echo "Updated ${req_file}"
}

# Update requirements for each service
for service in "${SERVICES[@]}"; do
    if [ -d "$service" ]; then
        update_requirements "$service"
    else
        echo "Service directory not found: $service"
    fi
done

echo "Done! Please review the changes and test the services."