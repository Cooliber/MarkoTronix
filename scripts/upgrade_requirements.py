#!/usr/bin/env python3
"""
Script to upgrade Python dependencies in requirements.txt files.
This script uses pip-compile from pip-tools to upgrade dependencies.
"""

import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# Directories containing requirements.txt files
SERVICES = [
    "mail-ingest-service",
    "offer-generation",
    "link-service"
]

# Special cases for packages that need specific versions
SPECIAL_CASES = {
    "hellosign-python-sdk": "==5.2.0  # Updated to latest version",
    "httpx": ">=0.23.0,<0.24.0  # Keep this version for supabase compatibility"
}

def install_pip_tools():
    """Install pip-tools if not already installed."""
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pip-tools"],
            check=True,
            capture_output=True,
            text=True
        )
        print("pip-tools installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to install pip-tools: {e.stderr}")
        return False

def process_requirements(req_file):
    """Process requirements file to handle special cases."""
    with open(req_file, "r") as f:
        requirements = f.readlines()
    
    # Create a temporary file for the processed requirements
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".in") as temp:
        temp_path = temp.name
        for line in requirements:
            line = line.strip()
            if not line or line.startswith("#"):
                temp.write(f"{line}\n")
                continue
            
            # Extract package name
            match = re.match(r"([a-zA-Z0-9_\-\.]+)(.+)?", line)
            if not match:
                temp.write(f"{line}\n")
                continue
            
            package_name = match.group(1)
            
            # Check if this is a special case
            if package_name in SPECIAL_CASES:
                temp.write(f"{package_name}{SPECIAL_CASES[package_name]}\n")
                continue
            
            # Extract the base requirement without version constraints
            if "#" in line:
                comment = line.split("#", 1)[1]
                if "specific version" in comment.lower():
                    temp.write(f"{line}\n")
                    continue
                
                # Keep any comments
                temp.write(f"{package_name} # {comment}\n")
            else:
                temp.write(f"{package_name}\n")
    
    return temp_path

def update_requirements(service_dir):
    """Update requirements.txt file with latest compatible versions."""
    req_file = Path(service_dir) / "requirements.txt"
    if not req_file.exists():
        print(f"Requirements file not found: {req_file}")
        return False
    
    print(f"\nUpdating requirements for {service_dir}...")
    
    # Process the requirements file
    input_file = process_requirements(req_file)
    
    try:
        # Create a backup of the original requirements file
        backup_file = f"{req_file}.bak"
        os.rename(req_file, backup_file)
        
        # Run pip-compile to generate updated requirements
        result = subprocess.run(
            [
                sys.executable, "-m", "piptools", "compile",
                "--output-file", str(req_file),
                "--upgrade",
                "--annotation-style", "line",
                "--allow-unsafe",
                "--resolver=backtracking",
                input_file
            ],
            check=True,
            capture_output=True,
            text=True
        )
        
        print(f"Updated {req_file}")
        print(result.stdout)
        
        # Clean up
        os.unlink(input_file)
        os.unlink(backup_file)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to update {req_file}: {e.stderr}")
        # Restore the original file if it exists
        if os.path.exists(backup_file):
            os.rename(backup_file, req_file)
        # Clean up the temporary file
        if os.path.exists(input_file):
            os.unlink(input_file)
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        # Restore the original file if it exists
        if os.path.exists(backup_file):
            os.rename(backup_file, req_file)
        # Clean up the temporary file
        if os.path.exists(input_file):
            os.unlink(input_file)
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