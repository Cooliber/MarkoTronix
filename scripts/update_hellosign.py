#!/usr/bin/env python3
"""
Script to update hellosign-python-sdk to version 5.2.0 in requirements.txt files.
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

def update_hellosign(service_dir):
    """Update hellosign-python-sdk to version 5.2.0 in requirements.txt."""
    req_file = Path(service_dir) / "requirements.txt"
    if not req_file.exists():
        print(f"Requirements file not found: {req_file}")
        return False
    
    print(f"\nChecking {service_dir} for hellosign-python-sdk...")
    
    # Read current requirements
    with open(req_file, "r") as f:
        requirements = f.readlines()
    
    updated = False
    updated_requirements = []
    for req in requirements:
        if req.strip().startswith("hellosign-python-sdk"):
            updated_req = "hellosign-python-sdk==5.2.0  # Updated to latest version\n"
            print(f"  Updating: {req.strip()} -> {updated_req.strip()}")
            updated_requirements.append(updated_req)
            updated = True
        else:
            updated_requirements.append(req)
    
    if updated:
        # Write updated requirements
        with open(req_file, "w") as f:
            f.writelines(updated_requirements)
        
        print(f"Updated {req_file}")
    else:
        print(f"  No hellosign-python-sdk found in {req_file}")
    
    return updated

def main():
    """Main function to update hellosign-python-sdk in all services."""
    root_dir = Path(__file__).parent.parent
    
    for service in SERVICES:
        service_dir = root_dir / service
        if service_dir.exists():
            update_hellosign(service_dir)
        else:
            print(f"Service directory not found: {service_dir}")
    
    print("\nDone! Please review the changes and test the services.")

if __name__ == "__main__":
    main()