#!/usr/bin/env python3
"""
Script to update Python dependencies in requirements.txt files.
This script uses pip-tools to update dependencies to their latest compatible versions.
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

def install_pip_tools():
    """Install pip-tools if not already installed."""
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pip-tools"],
            check=True
        )
        print("pip-tools installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("Failed to install pip-tools")
        return False

def create_input_file(requirements_file, input_file):
    """Create an input file for pip-compile from requirements.txt."""
    with open(requirements_file, "r") as f:
        requirements = f.readlines()
    
    with open(input_file, "w") as f:
        for req in requirements:
            req = req.strip()
            if not req or req.startswith("#"):
                f.write(f"{req}\n")
                continue
            
            # Parse package name and version constraint
            match = re.match(r"([a-zA-Z0-9_\-\.]+)(.+)?", req)
            if not match:
                f.write(f"{req}\n")
                continue
            
            package_name = match.group(1)
            version_constraint = match.group(2) if match.group(2) else ""
            
            # Check if this is a pinned version we should keep
            if "==" in version_constraint and "#" in req and "specific version" in req.lower():
                f.write(f"{req}\n")
                continue
            
            # For hellosign-python-sdk, update to version 5.2.0
            if package_name == "hellosign-python-sdk":
                f.write(f"{package_name}==5.2.0  # Updated to latest version\n")
                continue
            
            # For httpx, keep the specific version for supabase compatibility
            if package_name == "httpx" and "supabase compatibility" in req:
                f.write(f"{req}\n")
                continue
            
            # For other packages, extract the minimum version
            if ">=" in version_constraint:
                min_version = re.search(r">=([^,<]+)", version_constraint)
                if min_version:
                    min_version = min_version.group(1).strip()
                    f.write(f"{package_name}>={min_version}\n")
                    continue
            
            # If we couldn't parse, keep the original
            f.write(f"{req}\n")

def update_requirements(service_dir):
    """Update requirements.txt file with latest compatible versions."""
    req_file = Path(service_dir) / "requirements.txt"
    if not req_file.exists():
        print(f"Requirements file not found: {req_file}")
        return False
    
    print(f"\nUpdating requirements for {service_dir}...")
    
    # Create a temporary input file
    input_file = Path(service_dir) / "requirements.in"
    create_input_file(req_file, input_file)
    
    # Run pip-compile to generate updated requirements
    try:
        subprocess.run(
            [
                sys.executable, "-m", "piptools", "compile",
                "--output-file", req_file,
                "--upgrade",
                "--no-header",
                "--no-emit-index-url",
                input_file
            ],
            check=True
        )
        print(f"Updated {req_file}")
        
        # Clean up the input file
        input_file.unlink()
        return True
    except subprocess.CalledProcessError:
        print(f"Failed to update {req_file}")
        # Clean up the input file
        if input_file.exists():
            input_file.unlink()
        return False

def main():
    """Main function to update requirements for all services."""
    if not install_pip_tools():
        print("Cannot proceed without pip-tools")
        return
    
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