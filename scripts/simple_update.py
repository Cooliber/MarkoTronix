#!/usr/bin/env python3
"""
Simple script to update Python dependencies in requirements.txt files.
This script updates version constraints to allow newer versions.
"""

import os
import re
from pathlib import Path

# Directories containing requirements.txt files
SERVICES = [
    "mail-ingest-service",
    "offer-generation",
    "link-service"
]

# Version updates for specific packages
VERSION_UPDATES = {
    "fastapi": ">=0.104.1,<0.116.0",
    "uvicorn": ">=0.23.2,<0.35.0",
    "pydantic": ">=2.4.2,<2.12.0",
    "pydantic-settings": ">=2.0.3,<2.10.0",
    "python-dotenv": ">=1.0.0,<1.2.0",
    "sqlalchemy": ">=2.0.23,<2.1.0",
    "psycopg2-binary": ">=2.9.9,<2.10.0",
    "redis": ">=5.0.1,<6.1.0",
    "celery": ">=5.3.4,<5.4.0",
    "jinja2": ">=3.1.2,<3.2.0",
    "python-jose": ">=3.3.0,<3.5.0",
    "python-multipart": ">=0.0.6,<0.1.0",
    "email-validator": ">=2.1.0,<2.2.0",
    "supabase": ">=1.0.3,<2.16.0",
    "hellosign-python-sdk": "==5.2.0  # Updated to latest version",
    "httpx": ">=0.23.0,<0.24.0  # Keep this version for supabase compatibility",
    "openai": ">=1.6.1,<1.7.0  # Keep compatible with langchain-openai",
    "langchain": ">=0.0.335,<0.1.0",
    "langchain-openai": ">=0.0.2,<0.1.0",
    "tenacity": ">=8.2.3,<8.3.0",
    "aiohttp": ">=3.8.5,<3.9.0",
    "pillow": ">=10.0.0,<10.1.0",
    "docusign-esign": ">=3.22.0,<4.1.0",
    "weasyprint": ">=60.1,<61.0",
    "pyppeteer": ">=1.0.2,<1.1.0",
    "imap-tools": ">=1.0.0,<1.1.0",
    "aiosmtplib": ">=2.0.2,<2.1.0"
}

def update_requirements(service_dir):
    """Update requirements.txt file with newer version constraints."""
    req_file = Path(service_dir) / "requirements.txt"
    if not req_file.exists():
        print(f"Requirements file not found: {req_file}")
        return False
    
    print(f"\nUpdating requirements for {service_dir}...")
    
    # Read current requirements
    with open(req_file, "r") as f:
        requirements = f.readlines()
    
    updated_requirements = []
    for req in requirements:
        req = req.strip()
        if not req or req.startswith("#"):
            updated_requirements.append(req)
            continue
        
        # Parse package name and version constraint
        match = re.match(r"([a-zA-Z0-9_\-\.]+)(.+)?", req)
        if not match:
            updated_requirements.append(req)
            continue
        
        package_name = match.group(1)
        
        # Check if we have an update for this package
        if package_name in VERSION_UPDATES:
            updated_req = f"{package_name}{VERSION_UPDATES[package_name]}"
            print(f"  Updating {package_name}: {req} -> {updated_req}")
            updated_requirements.append(updated_req)
        else:
            updated_requirements.append(req)
    
    # Write updated requirements
    with open(req_file, "w") as f:
        f.write("\n".join(updated_requirements) + "\n")
    
    print(f"Updated {req_file}")
    return True

def main():
    """Main function to update requirements for all services."""
    root_dir = Path(__file__).parent.parent
    
    for service in SERVICES:
        service_dir = root_dir / service
        if service_dir.exists():
            update_requirements(service_dir)
        else:
            print(f"Service directory not found: {service_dir}")
    
    print("\nDone! Please review the changes and test the services.")

if __name__ == "__main__":
    main()