# MarkoTronix HVAC CRM/ERP Production Deployment Guide

This document provides instructions for deploying the MarkoTronix HVAC CRM/ERP system to production.

## System Requirements

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.10+ (for local development)
- PostgreSQL 15+ (provided via Docker)
- Redis 7+ (provided via Docker)

## Production Deployment Steps

### 1. Prepare Environment Files

Create production environment files for each microservice:

```bash
# Copy example environment files
cp mail-ingest-service/.env.example mail-ingest-service/.env.production
cp offer-generation/.env.example offer-generation/.env.production
cp link-service/.env.example link-service/.env.production
cp hvac-ui/.env.example hvac-ui/.env.production
```

Edit each `.env.production` file to set the appropriate values for your production environment.

### 2. Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy-production.sh

# Run the deployment script
./deploy-production.sh
```

This script will:
- Build all Docker images
- Create a production Docker Compose file
- Create production environment files if they don't exist

### 3. Start the Production Environment

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check the status of all services
docker-compose -f docker-compose.production.yml ps
```

### 4. Verify Deployment

Check that all services are running correctly:

```bash
# Check the logs
docker-compose -f docker-compose.production.yml logs -f

# Check the health of each service
curl http://localhost:3000/api/health  # Frontend
curl http://localhost:8000/api/health  # API
curl http://localhost:8001/health      # Mail Ingest
curl http://localhost:8002/health      # Offer Generation
curl http://localhost:8003/health      # Link Service
```

### 5. Access the Application

- Frontend: http://localhost:3000
- API: http://localhost:8000/api
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (default credentials: admin/admin)

## Backup and Restore

### Database Backup

```bash
# Backup PostgreSQL database
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres hvac_crm > backup_$(date +%Y%m%d%H%M%S).sql
```

### Database Restore

```bash
# Restore PostgreSQL database
cat backup_file.sql | docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres hvac_crm
```

## Monitoring and Maintenance

### Monitoring

The system includes Prometheus and Grafana for monitoring:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

### Logs

View logs for all services:

```bash
docker-compose -f docker-compose.production.yml logs -f
```

View logs for a specific service:

```bash
docker-compose -f docker-compose.production.yml logs -f hvac-ui
```

### Updating the System

To update the system:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Run the deployment script again:
   ```bash
   ./deploy-production.sh
   ```

3. Restart the services:
   ```bash
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d
   ```

## Troubleshooting

### Common Issues

1. **Service fails to start**:
   - Check the logs: `docker-compose -f docker-compose.production.yml logs -f [service-name]`
   - Verify environment variables in `.env.production` files
   - Check disk space: `df -h`

2. **Database connection issues**:
   - Verify PostgreSQL is running: `docker-compose -f docker-compose.production.yml ps postgres`
   - Check database credentials in `.env.production` files
   - Try connecting manually: `docker-compose -f docker-compose.production.yml exec postgres psql -U postgres hvac_crm`

3. **Frontend not loading**:
   - Check the frontend logs: `docker-compose -f docker-compose.production.yml logs -f hvac-ui`
   - Verify API is accessible: `curl http://localhost:8000/api/health`
   - Check browser console for errors

### Getting Help

If you encounter issues not covered in this guide, please contact support at support@markotronix.com or open an issue in the project repository.