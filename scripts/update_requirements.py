#!/usr/bin/env python3
"""
Script to update Python dependencies in requirements.txt files.
This script checks for outdated packages and updates them to the latest compatible versions.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

# Directories containing requirements.txt files
SERVICES = [
    "mail-ingest-service",
    "offer-generation",
    "link-service"
]

def get_latest_version(package_name):
    """Get the latest version of a package from PyPI."""
    try:
        result = subprocess.run(
            ["pip", "index", "versions", package_name],
            capture_output=True,
            text=True,
            check=True
        )
        output = result.stdout
        # Extract the latest version
        match = re.search(r"Available versions: ([\d\.]+)", output)
        if match:
            return match.group(1)
        return None
    except subprocess.CalledProcessError:
        print(f"Error getting latest version for {package_name}")
        return None

def update_requirements(service_dir):
    """Update requirements.txt file with latest compatible versions."""
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
        version_constraint = match.group(2) if match.group(2) else ""
        
        # Check if this is a pinned version we should keep
        if "==" in version_constraint and "#" in req and "specific version" in req.lower():
            print(f"  Keeping pinned version: {req}")
            updated_requirements.append(req)
            continue
        
        # For hellosign-python-sdk, update to version 5.2.0
        if package_name == "hellosign-python-sdk":
            updated_req = f"{package_name}==5.2.0  # Updated to latest version"
            print(f"  Updating {package_name}: {req} -> {updated_req}")
            updated_requirements.append(updated_req)
            continue
        
        # For httpx, keep the specific version for supabase compatibility
        if package_name == "httpx" and "supabase compatibility" in req:
            updated_requirements.append(req)
            continue
        
        # For other packages, update the version constraint
        if ">=" in version_constraint:
            # Extract the minimum version and maximum version
            min_version = re.search(r">=([^,<]+)", version_constraint)
            max_version = re.search(r"<([^,]+)", version_constraint)
            
            if min_version:
                min_version = min_version.group(1).strip()
                latest_version = get_latest_version(package_name)
                
                if latest_version:
                    # Update the minimum version to the latest
                    major, minor, *rest = latest_version.split(".")
                    next_major = int(major) + 1
                    
                    if max_version:
                        max_version = max_version.group(1).strip()
                        updated_req = f"{package_name}>={latest_version},<{next_major}.0.0"
                    else:
                        updated_req = f"{package_name}>={latest_version},<{next_major}.0.0"
                    
                    print(f"  Updating {package_name}: {req} -> {updated_req}")
                    updated_requirements.append(updated_req)
                    continue
        
        # If we couldn't update, keep the original
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