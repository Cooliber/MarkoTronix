#!/bin/bash

# Setup script for configuring automated backups
# This script sets up a cron job to run the backup-containers.js script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or with sudo${NC}"
  exit 1
fi

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
  exit 1
fi

# Check if backup-containers.js exists
if [ ! -f "$SCRIPT_DIR/backup-containers.js" ]; then
  echo -e "${RED}backup-containers.js not found in $SCRIPT_DIR${NC}"
  exit 1
fi

# Install required Node.js packages
echo -e "${YELLOW}Installing required Node.js packages...${NC}"
cd "$SCRIPT_DIR" && npm install moment

# Create backup directory if it doesn't exist
BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Created backup directory: $BACKUP_DIR${NC}"

# Create log directory if it doesn't exist
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
echo -e "${GREEN}Created log directory: $LOG_DIR${NC}"

# Create the cron job
CRON_JOB="0 2 * * * cd $SCRIPT_DIR && /usr/bin/node backup-containers.js >> $LOG_DIR/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-containers.js"; then
  echo -e "${YELLOW}Cron job for backup already exists. Updating...${NC}"
  (crontab -l 2>/dev/null | grep -v "backup-containers.js"; echo "$CRON_JOB") | crontab -
else
  echo -e "${YELLOW}Adding new cron job...${NC}"
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
fi

echo -e "${GREEN}Cron job set up successfully!${NC}"
echo -e "Backups will run daily at 2:00 AM and be stored in: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "Logs will be written to: ${YELLOW}$LOG_DIR/backup.log${NC}"

# Create a test backup
echo -e "${YELLOW}Running a test backup...${NC}"
cd "$SCRIPT_DIR" && node backup-containers.js

echo -e "${GREEN}Setup complete!${NC}"
echo -e "You can manually run a backup anytime with: ${YELLOW}cd $SCRIPT_DIR && node backup-containers.js${NC}"
