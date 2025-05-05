#!/bin/bash

# Script to update Python dependencies in all microservices
# This script updates version constraints to allow newer versions

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
    
    echo "Updating requirements for ${service_dir}..."
    
    # Check if requirements.txt exists
    if [ ! -f "${service_dir}/requirements.txt" ]; then
        echo "Requirements file not found: ${service_dir}/requirements.txt"
        return 1
    fi
    
    # Create a backup of the original file
    cp "${service_dir}/requirements.txt" "${service_dir}/requirements.txt.bak"
    
    # Update fastapi
    sed -i 's/fastapi==.*/fastapi>=0.104.1,<0.116.0/' "${service_dir}/requirements.txt"
    
    # Update uvicorn
    sed -i 's/uvicorn==.*/uvicorn>=0.23.2,<0.35.0/' "${service_dir}/requirements.txt"
    
    # Update pydantic
    sed -i 's/pydantic==.*/pydantic>=2.4.2,<2.12.0/' "${service_dir}/requirements.txt"
    
    # Update pydantic-settings
    sed -i 's/pydantic-settings==.*/pydantic-settings>=2.0.3,<2.10.0/' "${service_dir}/requirements.txt"
    
    # Update python-dotenv
    sed -i 's/python-dotenv==.*/python-dotenv>=1.0.0,<1.2.0/' "${service_dir}/requirements.txt"
    
    # Update sqlalchemy
    sed -i 's/sqlalchemy==.*/sqlalchemy>=2.0.23,<2.1.0/' "${service_dir}/requirements.txt"
    
    # Update psycopg2-binary
    sed -i 's/psycopg2-binary==.*/psycopg2-binary>=2.9.9,<2.10.0/' "${service_dir}/requirements.txt"
    
    # Update redis
    sed -i 's/redis==.*/redis>=5.0.1,<6.1.0/' "${service_dir}/requirements.txt"
    
    # Update python-jose
    sed -i 's/python-jose==.*/python-jose>=3.3.0,<3.5.0/' "${service_dir}/requirements.txt"
    
    # Update docusign-esign
    sed -i 's/docusign-esign==.*/docusign-esign>=3.22.0,<4.1.0/' "${service_dir}/requirements.txt"
    
    # Update hellosign-python-sdk
    sed -i 's/hellosign-python-sdk==.*/hellosign-python-sdk==4.0.0  # Updated to latest stable version/' "${service_dir}/requirements.txt"
    
    # Update httpx
    sed -i 's/httpx==.*/httpx>=0.23.0,<0.24.0  # Keep this version for supabase compatibility/' "${service_dir}/requirements.txt"
    
    # Update python-multipart
    sed -i 's/python-multipart==.*/python-multipart>=0.0.6,<0.1.0/' "${service_dir}/requirements.txt"
    
    # Update jinja2
    sed -i 's/jinja2==.*/jinja2>=3.1.2,<3.2.0/' "${service_dir}/requirements.txt"
    
    # Update supabase
    sed -i 's/supabase==.*/supabase>=1.0.3,<2.16.0/' "${service_dir}/requirements.txt"
    
    # Update email-validator
    sed -i 's/email-validator==.*/email-validator>=2.1.0,<2.2.0/' "${service_dir}/requirements.txt"
    
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