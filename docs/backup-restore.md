# MarkoTronix Backup and Restore Guide

This document provides comprehensive guidance for backing up and restoring the MarkoTronix HVAC CRM system, with a focus on the mail-ingest-service and other critical components.

## Backup System Overview

The backup system is designed to create regular backups of:

1. **PostgreSQL Database**: All tables and data
2. **Docker Volumes**: Including mail attachments, offer storage, and other persistent data
3. **Supabase Data**: Email and attachment records stored in Supabase

Backups are stored in a structured directory format with date-based organization and retention policies.

## Backup Configuration

The backup system is configured in the `backup-containers.js` script with the following settings:

```javascript
const config = {
  backupDir: path.join(__dirname, 'backups'),
  databaseBackups: [
    {
      containerName: 'markotronix-postgres-1',
      database: 'hvac_crm',
      user: 'postgres',
      filename: 'postgres_hvac_crm'
    }
  ],
  volumeBackups: [
    {
      name: 'mail-attachments',
      filename: 'mail-attachments'
    },
    {
      name: 'offer-storage',
      filename: 'offer-storage'
    },
    {
      name: 'link-storage',
      filename: 'link-storage'
    },
    {
      name: 'postgres-data',
      filename: 'postgres-data'
    },
    {
      name: 'redis-data',
      filename: 'redis-data'
    }
  ],
  retention: {
    days: 7,  // Keep backups for 7 days
    weekly: 4, // Keep 4 weekly backups
    monthly: 3 // Keep 3 monthly backups
  },
  supabaseBackup: {
    enabled: true,
    tables: ['emails', 'attachments', 'clients', 'offers', 'links']
  }
};
```

### Retention Policy

The backup system implements a tiered retention policy:

- **Daily Backups**: Kept for 7 days
- **Weekly Backups**: 4 weeks of Sunday backups
- **Monthly Backups**: 3 months of 1st-of-month backups

This ensures a balance between having recent backups available for quick recovery and maintaining historical backups for longer-term needs.

## Setting Up Automated Backups

### Prerequisites

- Node.js 14 or higher
- Docker and Docker Compose
- Root or sudo access (for setting up cron jobs)

### Installation

1. Run the setup script to configure automated backups:

```bash
sudo bash setup-backup-cron.sh
```

This script will:
- Install required Node.js packages
- Create backup and log directories
- Set up a daily cron job to run at 2:00 AM
- Run an initial test backup

### Manual Backup

To manually trigger a backup:

```bash
node backup-containers.js
```

### Backup Storage Structure

Backups are stored in the following directory structure:

```
backups/
├── 2023-05-01/
│   ├── postgres_hvac_crm_2023-05-01_02-00-00.sql.gz
│   ├── mail-attachments_2023-05-01_02-00-00.tar.gz
│   ├── offer-storage_2023-05-01_02-00-00.tar.gz
│   ├── link-storage_2023-05-01_02-00-00.tar.gz
│   ├── postgres-data_2023-05-01_02-00-00.tar.gz
│   ├── redis-data_2023-05-01_02-00-00.tar.gz
│   └── supabase_2023-05-01_02-00-00.tar.gz
├── 2023-05-02/
│   └── ...
└── ...
```

## Restoring from Backup

### Using the Restore Script

The `restore-from-backup.js` script provides an interactive way to restore from backups:

```bash
node restore-from-backup.js
```

The script will:
1. List available backup dates
2. Let you select a backup date
3. List available backup files for that date
4. Let you select a specific backup file to restore
5. Perform the restore operation based on the file type

### Manual Database Restore

To manually restore the PostgreSQL database:

```bash
# Decompress the backup file
gunzip -c backups/2023-05-01/postgres_hvac_crm_2023-05-01_02-00-00.sql.gz > temp_restore.sql

# Restore to PostgreSQL
cat temp_restore.sql | docker exec -i markotronix-postgres-1 psql -U postgres hvac_crm

# Clean up
rm temp_restore.sql
```

### Manual Volume Restore

To manually restore a Docker volume:

```bash
# Stop the containers
docker-compose stop

# Restore the volume
docker run --rm -v markotronix_mail-attachments:/dest -v $(pwd)/backups/2023-05-01:/backup alpine sh -c "rm -rf /dest/* && tar -xzf /backup/mail-attachments_2023-05-01_02-00-00.tar.gz -C /dest"

# Restart the containers
docker-compose up -d
```

### Manual Supabase Data Restore

To manually restore Supabase data:

```bash
# Extract the backup
mkdir -p temp_supabase
tar -xzf backups/2023-05-01/supabase_2023-05-01_02-00-00.tar.gz -C temp_supabase

# Import each table
for file in temp_supabase/supabase/*.json; do
  table=$(basename $file | cut -d_ -f1)
  curl -X POST http://localhost:8001/import/$table -H "Content-Type: application/json" -d @$file
done

# Clean up
rm -rf temp_supabase
```

## Backup Verification

It's important to regularly verify that backups are working correctly and can be restored. We recommend:

1. **Weekly Verification**: Restore a test database to a separate container
2. **Monthly Full Test**: Perform a complete restore to a test environment
3. **Automated Verification**: The backup script includes basic verification of backup files

### Verification Script

A simple verification can be performed with:

```bash
# Check if recent backups exist
find backups -type f -mtime -1 | grep -q .
if [ $? -eq 0 ]; then
  echo "Recent backups found"
else
  echo "WARNING: No recent backups found"
fi

# Check backup file integrity
for file in $(find backups -type f -name "*.gz" -mtime -1); do
  gzip -t $file
  if [ $? -eq 0 ]; then
    echo "$file: OK"
  else
    echo "$file: CORRUPTED"
  fi
done
```

## Disaster Recovery Procedures

### Complete System Recovery

In case of a complete system failure:

1. Set up a new server with Docker and Docker Compose
2. Clone the MarkoTronix repository
3. Copy the most recent backups to the new server
4. Run the restore script for each component:
   ```bash
   node restore-from-backup.js
   ```
5. Verify the system is functioning correctly

### Partial Recovery

For recovering specific components:

1. **Database Only**: Use the database restore procedure
2. **Mail Attachments Only**: Restore only the mail-attachments volume
3. **Supabase Data Only**: Use the Supabase data restore procedure

## Monitoring Backup Status

The backup system logs all activities to:

- **Console Output**: During manual runs
- **Log File**: `backups/backup.log`

To monitor backup status:

```bash
# Check the most recent backup log
tail -n 50 backups/backup.log

# Check for errors
grep ERROR backups/backup.log

# Check backup sizes
du -sh backups/*
```

## Troubleshooting

### Common Issues and Solutions

1. **Backup Fails with Permission Error**:
   - Ensure the user running the backup has write permissions to the backup directory
   - Run with sudo if necessary

2. **Database Backup Fails**:
   - Check PostgreSQL container is running: `docker ps | grep postgres`
   - Verify database credentials in the config

3. **Volume Backup Fails**:
   - Ensure volume names match those in Docker: `docker volume ls`
   - Check for sufficient disk space: `df -h`

4. **Restore Fails**:
   - Verify backup file integrity: `gzip -t backup_file.gz`
   - Ensure target containers are running for database restores
   - Stop containers before volume restores

### Getting Help

If you encounter issues not covered in this guide:

1. Check the Docker and PostgreSQL logs:
   ```bash
   docker logs markotronix-postgres-1
   ```

2. Verify Docker volume mounts:
   ```bash
   docker inspect markotronix-postgres-1 | grep -A 10 Mounts
   ```

3. Contact the DevOps team at devops@markotronix.example.com

## Best Practices

1. **Regular Testing**: Test restore procedures monthly
2. **Off-site Copies**: Copy backups to an off-site location or cloud storage
3. **Encryption**: Consider encrypting sensitive backup data
4. **Documentation**: Keep this guide updated with any changes to the backup system
5. **Monitoring**: Set up alerts for backup failures

## Appendix: Backup Script Details

The backup script performs the following operations:

1. Creates a date-based directory for the current backup
2. Backs up the PostgreSQL database using `pg_dump`
3. Backs up Docker volumes using `tar`
4. Backs up Supabase data using the API export endpoints
5. Compresses all backups with gzip
6. Applies the retention policy to remove old backups
7. Logs all activities to the backup log
