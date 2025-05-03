# HVAC CRM System Runbook

This runbook provides operational procedures for maintaining, troubleshooting, and recovering the HVAC CRM system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Regular Maintenance](#regular-maintenance)
3. [Monitoring](#monitoring)
4. [Backup and Recovery](#backup-and-recovery)
5. [Troubleshooting](#troubleshooting)
6. [Scaling](#scaling)
7. [Security](#security)
8. [Disaster Recovery](#disaster-recovery)

## System Overview

The HVAC CRM system consists of the following components:

- **API Service**: FastAPI application serving REST API endpoints
- **Worker Service**: Celery workers processing background tasks
- **Database**: PostgreSQL (Supabase) storing application data
- **Cache & Message Broker**: Redis for caching and task queue
- **Storage**: MinIO for file storage
- **Vector Database**: Qdrant for embeddings and similarity search
- **Reverse Proxy**: Nginx for routing and SSL termination
- **Monitoring**: Prometheus, Grafana, and Jaeger for observability
- **Workflow Automation**: n8n for integrations and automation

## Regular Maintenance

### Daily Tasks

- Check system health via monitoring dashboards
- Review error logs for any issues
- Verify backup completion

### Weekly Tasks

- Review system performance metrics
- Check disk space usage
- Rotate logs if needed
- Review security alerts

### Monthly Tasks

- Apply security updates
- Review and optimize database performance
- Check SSL certificate expiration
- Review user access and permissions

### Quarterly Tasks

- Perform full system backup
- Test disaster recovery procedures
- Review and update documentation
- Perform security audit

## Monitoring

### Health Checks

The system provides health check endpoints for each service:

- API Service: `GET /health`
- Worker Service: Flower dashboard
- Database: PostgreSQL health check
- Redis: Redis health check
- MinIO: MinIO health check
- Qdrant: Qdrant health check

### Monitoring Dashboards

Access the monitoring dashboards at:

- Grafana: http://localhost:3000 (or your production URL)
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686
- Flower: http://localhost:5555
- RedisInsight: http://localhost:8001

### Key Metrics to Monitor

- **API Service**:
  - Request rate
  - Error rate
  - Response time
  - CPU and memory usage

- **Worker Service**:
  - Task queue length
  - Task processing time
  - Task success/failure rate
  - Worker count

- **Database**:
  - Connection count
  - Query performance
  - Transaction rate
  - Disk usage

- **Redis**:
  - Memory usage
  - Connection count
  - Command rate
  - Eviction rate

- **Storage**:
  - Disk usage
  - Request rate
  - Error rate

### Alerting

Alerts are configured in Prometheus and sent via various channels:

- Email
- Slack
- SMS (via Twilio)
- Telegram

To configure alerting:

1. Edit the Prometheus alerting rules in `services/prometheus/alert_rules.yml`
2. Update the alertmanager configuration in `services/prometheus/alertmanager.yml`
3. Restart Prometheus and Alertmanager:
   ```bash
   docker-compose restart prometheus alertmanager
   ```

## Backup and Recovery

### Database Backup

#### Automated Backups

The system performs automated database backups daily. Backups are stored in MinIO and can be accessed via the MinIO Console.

#### Manual Backup

To perform a manual database backup:

```bash
docker-compose exec postgres pg_dump -U postgres -d hvac_crm > backup_$(date +%Y%m%d_%H%M%S).sql
```

### File Storage Backup

MinIO data is backed up using MinIO's built-in replication or by backing up the MinIO data volume.

To create a backup of MinIO data:

```bash
docker-compose exec storage mc mirror myminio/offers backup/offers
docker-compose exec storage mc mirror myminio/reports backup/reports
docker-compose exec storage mc mirror myminio/attachments backup/attachments
```

### System Configuration Backup

To backup system configuration:

```bash
tar -czvf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  services/nginx/conf \
  services/prometheus \
  services/grafana/provisioning \
  .env
```

### Recovery Procedures

#### Database Recovery

To restore the database from a backup:

```bash
cat backup_file.sql | docker-compose exec -T postgres psql -U postgres -d hvac_crm
```

#### File Storage Recovery

To restore MinIO data:

```bash
docker-compose exec storage mc mirror backup/offers myminio/offers
docker-compose exec storage mc mirror backup/reports myminio/reports
docker-compose exec storage mc mirror backup/attachments myminio/attachments
```

#### Full System Recovery

To recover the entire system:

1. Set up a new environment with Docker and Docker Compose
2. Clone the repository
3. Restore the `.env` file and configuration files
4. Start the containers: `docker-compose up -d`
5. Restore the database
6. Restore MinIO data
7. Verify system functionality

## Troubleshooting

### Common Issues and Solutions

#### API Service Issues

**Issue**: API service is not responding

**Solution**:
1. Check if the container is running:
   ```bash
   docker-compose ps api
   ```
2. Check the logs:
   ```bash
   docker-compose logs api
   ```
3. Restart the service:
   ```bash
   docker-compose restart api
   ```
4. If the issue persists, check the database connection and other dependencies

**Issue**: API service is returning 500 errors

**Solution**:
1. Check the logs for error messages:
   ```bash
   docker-compose logs api
   ```
2. Check the database connection
3. Verify that all required environment variables are set
4. Check for recent code changes that might have introduced bugs

#### Worker Service Issues

**Issue**: Tasks are not being processed

**Solution**:
1. Check if the worker container is running:
   ```bash
   docker-compose ps worker
   ```
2. Check the logs:
   ```bash
   docker-compose logs worker
   ```
3. Check the Redis connection
4. Verify that tasks are being enqueued correctly
5. Restart the worker:
   ```bash
   docker-compose restart worker
   ```

**Issue**: Tasks are failing

**Solution**:
1. Check the logs for error messages:
   ```bash
   docker-compose logs worker
   ```
2. Check the Flower dashboard for task details
3. Verify that all required environment variables are set
4. Check for recent code changes that might have introduced bugs

#### Database Issues

**Issue**: Database connection errors

**Solution**:
1. Check if the database container is running:
   ```bash
   docker-compose ps postgres
   ```
2. Check the logs:
   ```bash
   docker-compose logs postgres
   ```
3. Verify that the database credentials are correct
4. Check for disk space issues
5. Restart the database:
   ```bash
   docker-compose restart postgres
   ```

**Issue**: Slow database queries

**Solution**:
1. Check the database logs for slow queries
2. Analyze the query execution plan
3. Add indexes if needed
4. Optimize the query
5. Consider scaling the database

#### Redis Issues

**Issue**: Redis connection errors

**Solution**:
1. Check if the Redis container is running:
   ```bash
   docker-compose ps redis
   ```
2. Check the logs:
   ```bash
   docker-compose logs redis
   ```
3. Verify that the Redis credentials are correct
4. Check for memory issues
5. Restart Redis:
   ```bash
   docker-compose restart redis
   ```

**Issue**: Redis is running out of memory

**Solution**:
1. Check the Redis memory usage in RedisInsight
2. Increase the Redis memory limit in `docker-compose.yml`
3. Configure Redis to evict keys when memory is full
4. Optimize the application to use less Redis memory

#### Storage Issues

**Issue**: MinIO is not accessible

**Solution**:
1. Check if the MinIO container is running:
   ```bash
   docker-compose ps storage
   ```
2. Check the logs:
   ```bash
   docker-compose logs storage
   ```
3. Verify that the MinIO credentials are correct
4. Check for disk space issues
5. Restart MinIO:
   ```bash
   docker-compose restart storage
   ```

**Issue**: File uploads are failing

**Solution**:
1. Check the API logs for error messages
2. Verify that the MinIO credentials are correct
3. Check for disk space issues
4. Verify that the required buckets exist
5. Check the file size limits

### Diagnostic Commands

#### Checking System Status

```bash
docker-compose ps
```

#### Checking Logs

```bash
# All logs
docker-compose logs

# Specific service logs
docker-compose logs api
docker-compose logs worker
docker-compose logs postgres
docker-compose logs redis
docker-compose logs storage

# Follow logs
docker-compose logs -f api
```

#### Checking Resource Usage

```bash
docker stats
```

#### Checking Database Status

```bash
docker-compose exec postgres psql -U postgres -d hvac_crm -c "SELECT version();"
docker-compose exec postgres psql -U postgres -d hvac_crm -c "SELECT count(*) FROM pg_stat_activity;"
```

#### Checking Redis Status

```bash
docker-compose exec redis redis-cli info
```

#### Checking MinIO Status

```bash
docker-compose exec storage mc admin info myminio
```

## Scaling

### Horizontal Scaling

#### Scaling the API Service

To scale the API service horizontally:

1. Update the `docker-compose.yml` file to add more API service instances:
   ```yaml
   api:
     deploy:
       replicas: 3
   ```

2. Update the Nginx configuration to load balance across the instances:
   ```nginx
   upstream api {
     server api_1:8000;
     server api_2:8000;
     server api_3:8000;
   }

   server {
     location /api/ {
       proxy_pass http://api/;
     }
   }
   ```

3. Apply the changes:
   ```bash
   docker-compose up -d
   ```

#### Scaling the Worker Service

To scale the worker service horizontally:

1. Update the `docker-compose.yml` file to add more worker instances:
   ```yaml
   worker:
     deploy:
       replicas: 3
   ```

2. Apply the changes:
   ```bash
   docker-compose up -d
   ```

### Vertical Scaling

To scale services vertically, update the resource limits in the `docker-compose.yml` file:

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Database Scaling

For database scaling, consider:

1. Increasing the database resources
2. Implementing read replicas
3. Sharding the database
4. Using a managed database service

### Redis Scaling

For Redis scaling, consider:

1. Increasing the Redis resources
2. Implementing Redis Cluster
3. Using a managed Redis service

## Security

### SSL/TLS Configuration

The system uses Nginx for SSL/TLS termination. SSL certificates are stored in `services/nginx/certs/`.

To update SSL certificates:

1. Place the new certificate and key in `services/nginx/certs/`:
   - `server.crt`: SSL certificate
   - `server.key`: SSL private key

2. Restart Nginx:
   ```bash
   docker-compose restart nginx
   ```

### Authentication

The system uses JWT for authentication. JWT secrets are configured in the `.env` file.

To update the JWT secret:

1. Update the `SECRET_KEY` in the `.env` file
2. Restart the API service:
   ```bash
   docker-compose restart api
   ```

### Firewall Configuration

Configure the firewall to allow only necessary ports:

- 80: HTTP (redirects to HTTPS)
- 443: HTTPS
- 22: SSH (for server access)

All other ports should be blocked or restricted to specific IP addresses.

### Security Updates

To apply security updates:

1. Update the base Docker images:
   ```bash
   docker-compose pull
   ```

2. Restart the services:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Security Monitoring

Monitor security events using:

- System logs
- Prometheus alerts
- Security scanning tools

## Disaster Recovery

### Disaster Recovery Plan

1. **Identify the disaster**: Determine the type and scope of the disaster
2. **Activate the recovery team**: Notify the team responsible for recovery
3. **Assess the damage**: Determine what components are affected
4. **Recover infrastructure**: Set up new infrastructure if needed
5. **Restore data**: Restore from backups
6. **Verify functionality**: Test the system to ensure it's working correctly
7. **Resume operations**: Switch traffic to the recovered system
8. **Post-mortem analysis**: Analyze the cause and improve the recovery process

### Recovery Time Objectives (RTO)

- Critical components (API, Database): 1 hour
- Non-critical components (Monitoring, Workflow Automation): 4 hours

### Recovery Point Objectives (RPO)

- Database: 24 hours (daily backups)
- File Storage: 24 hours (daily backups)

### Testing Disaster Recovery

Test the disaster recovery process quarterly:

1. Set up a test environment
2. Restore from backups
3. Verify functionality
4. Document any issues and improvements

### Disaster Recovery Scenarios

#### Scenario 1: Server Failure

1. Provision a new server
2. Install Docker and Docker Compose
3. Clone the repository
4. Restore configuration files
5. Start the containers
6. Restore data from backups
7. Verify functionality
8. Update DNS if needed

#### Scenario 2: Database Corruption

1. Stop the affected services
2. Restore the database from the latest backup
3. Start the services
4. Verify functionality

#### Scenario 3: Data Center Outage

1. Activate the secondary data center
2. Restore from backups if needed
3. Update DNS to point to the secondary data center
4. Verify functionality

#### Scenario 4: Ransomware Attack

1. Isolate affected systems
2. Assess the damage
3. Rebuild systems from clean sources
4. Restore data from backups
5. Implement additional security measures
6. Verify functionality
7. Resume operations