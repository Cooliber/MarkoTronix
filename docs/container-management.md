# MarkoTronix Container Management Guide

This document provides comprehensive guidance for deploying, managing, and troubleshooting the containerized architecture of the MarkoTronix HVAC CRM system.

## Container Architecture Overview

The MarkoTronix system consists of the following containers:

1. **hvac-ui**: Next.js frontend application
2. **api**: Mock API or FastAPI backend service
3. **mail-ingest**: Service for processing incoming emails
4. **offer-generation**: Service for generating and managing offers
5. **link-service**: Service for managing shareable links
6. **redis**: Message queue and caching
7. **postgres**: Database for persistent storage

## Deployment Procedures

### Local Development Deployment

```bash
# Start all containers
docker-compose up -d

# Start only specific services
docker-compose up -d hvac-ui api

# Rebuild containers after changes
docker-compose up -d --build
```

### Production Deployment

```bash
# Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Deploy standalone UI only
docker-compose -f docker-compose.standalone.yml up -d
```

### CI/CD Pipeline Deployment

The system includes GitHub Actions workflows for automated deployment:

1. **container-tests.yml**: Runs container tests before deployment
2. **deploy-with-nixpacks.yml**: Builds with Nixpacks and deploys to a server
3. **deploy-to-sevilla.yml**: Deploys to Sevilla platform

## Container Health Monitoring

All containers have health checks configured to ensure they're running properly:

| Container | Health Check | Interval | Timeout | Retries |
|-----------|--------------|----------|---------|---------|
| hvac-ui | HTTP GET /api/health | 30s | 10s | 3 |
| api | HTTP GET /api/health | 30s | 10s | 3 |
| mail-ingest | HTTP GET /health | 30s | 10s | 3 |
| offer-generation | HTTP GET /health | 30s | 10s | 3 |
| link-service | HTTP GET /health | 30s | 10s | 3 |
| redis | redis-cli ping | 30s | 10s | 3 |
| postgres | pg_isready | 10s | 5s | 5 |

### Monitoring Container Health

```bash
# Check container status
docker ps

# Check container health status
docker inspect --format "{{.Name}}: {{.State.Health.Status}}" $(docker ps -q)

# View container logs
docker logs markotronix-hvac-ui-1

# View container resource usage
docker stats
```

### Automated Monitoring

The system includes a monitoring script (`container-monitoring.js`) that checks container health and resource usage:

```bash
# Run the monitoring script
node container-monitoring.js

# Set up as a cron job
crontab -e
# Add: */5 * * * * cd /path/to/markotronix && node container-monitoring.js >> /var/log/container-monitoring.log 2>&1
```

## Container Resource Management

### Resource Thresholds

The following resource thresholds are configured for alerts:

- **CPU**: 80% usage
- **Memory**: 80% usage
- **Disk**: 80% usage
- **Restarts**: 5 restarts

### Scaling Containers

```bash
# Scale a specific service
docker-compose up -d --scale api=3

# Update resource limits
# Edit docker-compose.yml to add:
#   deploy:
#     resources:
#       limits:
#         cpus: '0.5'
#         memory: 512M
```

## Troubleshooting Procedures

### Common Issues and Solutions

1. **Container fails to start**:
   - Check logs: `docker logs <container_name>`
   - Verify environment variables
   - Check for port conflicts

2. **Container health check failing**:
   - Check service endpoint: `curl http://localhost:<port>/health`
   - Verify network connectivity between containers
   - Check for resource constraints

3. **Container performance issues**:
   - Check resource usage: `docker stats`
   - Look for memory leaks or high CPU usage
   - Consider scaling or increasing resource limits

### Recovery Procedures

```bash
# Restart a specific container
docker-compose restart <service_name>

# Rebuild and restart a container
docker-compose up -d --build <service_name>

# Complete system restart
docker-compose down
docker-compose up -d
```

## Backup and Restore

### Database Backup

```bash
# Backup PostgreSQL database
docker exec markotronix-postgres-1 pg_dump -U postgres hvac_crm > backup.sql

# Scheduled backups
# Add to crontab:
# 0 2 * * * docker exec markotronix-postgres-1 pg_dump -U postgres hvac_crm > /backups/hvac_crm_$(date +\%Y\%m\%d).sql
```

### Database Restore

```bash
# Restore PostgreSQL database
cat backup.sql | docker exec -i markotronix-postgres-1 psql -U postgres hvac_crm
```

### Volume Backup

```bash
# Backup a volume
docker run --rm -v markotronix_postgres-data:/source -v $(pwd):/backup alpine tar -czf /backup/postgres-data.tar.gz -C /source .
```

## Security Considerations

1. **Container Isolation**: Ensure containers only expose necessary ports
2. **Environment Variables**: Use .env files for sensitive information
3. **Regular Updates**: Keep base images updated for security patches
4. **Network Segmentation**: Use Docker networks to isolate container communication
5. **Resource Limits**: Set resource limits to prevent DoS attacks

## Container Testing

The system includes automated container tests:

```bash
# Run container tests
node test-containers.js

# Run container resource tests
node test-container-resources.js

# Generate test report
node run-container-tests.js
```

## Further Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Container Monitoring Best Practices](https://sysdig.com/blog/monitoring-docker-containers/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
