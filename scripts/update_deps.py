#!/usr/bin/env python3
"""
Script to update Python dependencies in requirements.txt files.
This script uses pip-upgrade to update dependencies to their latest compatible versions.
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

def install_pip_upgrade():
    """Install pip-upgrade if not already installed."""
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pip-upgrade"],
            check=True
        )
        print("pip-upgrade installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("Failed to install pip-upgrade")
        return False

def update_requirements(service_dir):
    """Update requirements.txt file with latest compatible versions."""
    req_file = Path(service_dir) / "requirements.txt"
    if not req_file.exists():
        print(f"Requirements file not found: {req_file}")
        return False
    
    print(f"\nUpdating requirements for {service_dir}...")
    
    # Create a backup of the original file
    backup_file = req_file.with_suffix(".txt.bak")
    with open(req_file, "r") as src, open(backup_file, "w") as dst:
        dst.write(src.read())
    
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
        
        # For other packages, try to get the latest version
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", f"{package_name}==", "--dry-run"],
                capture_output=True,
                text=True
            )
            output = result.stderr
            
            # Extract the latest version
            match = re.search(r"Could not find a version that satisfies the requirement.*\(from versions: (.+)\)", output)
            if match:
                versions = match.group(1).split(", ")
                latest_version = versions[-1].strip()
                
                # Update the version constraint
                if ">=" in version_constraint and "<" in version_constraint:
                    # Extract the major version
                    major, minor, *rest = latest_version.split(".")
                    next_major = int(major) + 1
                    
                    updated_req = f"{package_name}>={latest_version},<{next_major}.0.0"
                    if "#" in req:
                        comment = req.split("#", 1)[1]
                        updated_req += f" # {comment}"
                    
                    print(f"  Updating {package_name}: {req} -> {updated_req}")
                    updated_requirements.append(updated_req)
                    continue
                elif "==" in version_constraint:
                    updated_req = f"{package_name}=={latest_version}"
                    if "#" in req:
                        comment = req.split("#", 1)[1]
                        updated_req += f" # {comment}"
                    
                    print(f"  Updating {package_name}: {req} -> {updated_req}")
                    updated_requirements.append(updated_req)
                    continue
        except Exception as e:
            print(f"  Error updating {package_name}: {str(e)}")
        
        # If we couldn't update, keep the original
        updated_requirements.append(req)
    
    # Write updated requirements
    with open(req_file, "w") as f:
        f.write("\n".join(updated_requirements) + "\n")
    
    print(f"Updated {req_file}")
    return True

def main():
    """Main function to update requirements for all services."""
    if not install_pip_upgrade():
        print("Cannot proceed without pip-upgrade")
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