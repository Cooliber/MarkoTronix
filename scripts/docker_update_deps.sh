#!/bin/bash

# Script to update Python dependencies using Docker
# This ensures a clean environment for testing

# Exit on error
set -e

# Directories containing requirements.txt files
SERVICES=(
    "mail-ingest-service"
    "offer-generation"
    "link-service"
)

# Function to update requirements for a service
update_requirements() {
    local service_dir="$1"
    local service_name=$(basename "$service_dir")
    
    echo "Updating requirements for ${service_name}..."
    
    # Create a temporary Dockerfile
    cat > "${service_dir}/Dockerfile.update" << EOF
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# Install pip-tools
RUN pip install pip-tools

# Generate requirements.in from requirements.txt
RUN grep -v "^#" requirements.txt | sed -E 's/([a-zA-Z0-9_\-\.]+)(>=.+|==.+|<=.+|~=.+|>.+|<.+)?/\\1/' > requirements.in

# Special case for hellosign-python-sdk
RUN sed -i 's/^hellosign-python-sdk\$/hellosign-python-sdk==5.2.0/' requirements.in || true

# Special case for httpx
RUN sed -i 's/^httpx\$/httpx>=0.23.0,<0.24.0/' requirements.in || true

# Run pip-compile to generate updated requirements
RUN pip-compile --output-file=requirements.updated.txt --upgrade requirements.in

# Add back special comments
RUN sed -i 's/hellosign-python-sdk==5.2.0/hellosign-python-sdk==5.2.0  # Updated to latest version/' requirements.updated.txt || true
RUN sed -i 's/httpx>=0.23.0,<0.24.0/httpx>=0.23.0,<0.24.0  # Keep this version for supabase compatibility/' requirements.updated.txt || true

CMD ["cat", "requirements.updated.txt"]
EOF
    
    # Build the Docker image
    docker build -t "update-deps-${service_name}" -f "${service_dir}/Dockerfile.update" "${service_dir}"
    
    # Run the container and capture the output
    docker run --rm "update-deps-${service_name}" > "${service_dir}/requirements.txt.new"
    
    # Replace the old requirements file
    mv "${service_dir}/requirements.txt.new" "${service_dir}/requirements.txt"
    
    # Clean up
    rm "${service_dir}/Dockerfile.update"
    
    echo "Updated ${service_dir}/requirements.txt"
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