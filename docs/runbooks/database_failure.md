# Database Failure Runbook

This runbook provides guidance on handling database failures in the HVAC CRM system.

## Overview

The HVAC CRM system uses PostgreSQL as its primary database. This runbook covers procedures for handling database failures and recovery.

## Monitoring Database Health

### Health Check Endpoints

Each service exposes a health check endpoint that includes the status of the database connection:

- Mail Ingest Service: http://localhost:18001/health
- Offer Generation Service: http://localhost:18002/health
- Link Service: http://localhost:18003/health

### Prometheus Alerts

Prometheus is configured to alert when:
- A service has more than 5 database connection failures per minute

## Common Database Issues and Resolution

### Database Connection Failures

**Symptoms**:
- Services report database connection failures in health checks
- Services log database connection errors
- Prometheus alert for DatabaseConnectionFailures is triggered

**Resolution**:

1. Check if the database container is running:
   ```bash
   docker ps | grep postgres
   ```

2. If the container is not running, start it:
   ```bash
   docker start <postgres-container-id>
   ```

3. If the container is running, check the logs for errors:
   ```bash
   docker logs <postgres-container-id>
   ```

4. Check if the database is under high load:
   ```bash
   docker exec -it <postgres-container-id> psql -U postgres -c "SELECT * FROM pg_stat_activity;"
   ```

5. Check if the database has enough resources:
   ```bash
   docker stats <postgres-container-id>
   ```

6. If necessary, restart the database:
   ```bash
   docker restart <postgres-container-id>
   ```

7. Verify that services can connect to the database by checking their health endpoints.

### Database Disk Space Issues

**Symptoms**:
- Database logs show disk space warnings
- Database operations fail with disk space errors
- Services report database errors in health checks

**Resolution**:

1. Check disk space usage:
   ```bash
   docker exec -it <postgres-container-id> df -h
   ```

2. Identify large tables:
   ```bash
   docker exec -it <postgres-container-id> psql -U postgres -c "SELECT pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size, pg_size_pretty(pg_relation_size(c.oid)) AS table_size, pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) AS index_size, c.relname FROM pg_class c LEFT JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'r' AND n.nspname = 'public' ORDER BY pg_total_relation_size(c.oid) DESC LIMIT 10;"
   ```

3. Clean up unnecessary data:
   - Archive old data
   - Delete temporary data
   - Vacuum the database:
     ```bash
     docker exec -it <postgres-container-id> psql -U postgres -c "VACUUM FULL;"
     ```

4. If necessary, increase disk space allocation for the volume:
   - Backup the data
   - Create a new volume with more space
   - Restore the data to the new volume

### Database Performance Issues

**Symptoms**:
- Slow query responses
- High CPU or memory usage
- Services report high latency in health checks

**Resolution**:

1. Identify slow queries:
   ```bash
   docker exec -it <postgres-container-id> psql -U postgres -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds' ORDER BY duration DESC;"
   ```

2. Analyze query plans:
   ```bash
   docker exec -it <postgres-container-id> psql -U postgres -c "EXPLAIN ANALYZE <slow-query>;"
   ```

3. Optimize indexes:
   - Add indexes for frequently queried columns
   - Remove unused indexes

4. Tune PostgreSQL configuration:
   - Adjust shared_buffers
   - Adjust work_mem
   - Adjust maintenance_work_mem

5. If necessary, scale up the database resources:
   - Increase CPU allocation
   - Increase memory allocation

## Database Backup and Recovery

### Backup Procedures

Regular backups are essential for recovery from database failures. The HVAC CRM system uses the following backup procedures:

1. **Daily Full Backups**:
   ```bash
   docker exec -it <postgres-container-id> pg_dump -U postgres -F c -b -v -f /var/lib/postgresql/data/backup/hvac_crm_$(date +%Y%m%d).dump hvac_crm
   ```

2. **Continuous WAL Archiving**:
   PostgreSQL is configured to archive Write-Ahead Log (WAL) files for point-in-time recovery.

### Recovery Procedures

#### Restore from Full Backup

1. Stop the affected services:
   ```bash
   docker-compose stop mail-ingest offer-generation link-service
   ```

2. Drop and recreate the database:
   ```bash
   docker exec -it <postgres-container-id> psql -U postgres -c "DROP DATABASE hvac_crm;"
   docker exec -it <postgres-container-id> psql -U postgres -c "CREATE DATABASE hvac_crm;"
   ```

3. Restore from the latest backup:
   ```bash
   docker exec -it <postgres-container-id> pg_restore -U postgres -d hvac_crm -v /var/lib/postgresql/data/backup/hvac_crm_<date>.dump
   ```

4. Start the services:
   ```bash
   docker-compose start mail-ingest offer-generation link-service
   ```

5. Verify that services can connect to the database by checking their health endpoints.

#### Point-in-Time Recovery

For more advanced recovery scenarios, such as point-in-time recovery, refer to the PostgreSQL documentation:
https://www.postgresql.org/docs/current/continuous-archiving.html

## Preventive Measures

To prevent database failures:

1. **Monitor Database Health**:
   - Set up alerts for database connection failures
   - Set up alerts for disk space usage
   - Set up alerts for slow queries

2. **Regular Maintenance**:
   - Vacuum the database regularly
   - Analyze tables regularly
   - Check for index bloat

3. **Backup Strategy**:
   - Perform regular backups
   - Test backup restoration procedures
   - Store backups in multiple locations

4. **High Availability**:
   - Consider setting up PostgreSQL replication
   - Consider using a managed PostgreSQL service

## Escalation Path

If you are unable to resolve a database issue, escalate to the appropriate team:

1. **Level 1**: On-call engineer
2. **Level 2**: Database administrator
3. **Level 3**: Engineering manager
4. **Level 4**: CTO