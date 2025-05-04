# MarkoTronix Container Training Guide

This guide is designed to help team members understand and work with the containerized architecture of the MarkoTronix HVAC CRM system.

## Introduction to Containers

Containers are lightweight, standalone, executable packages that include everything needed to run an application: code, runtime, system tools, libraries, and settings.

### Key Benefits of Containers

- **Consistency**: Same environment across development, testing, and production
- **Isolation**: Applications run in isolated environments
- **Portability**: Run anywhere that supports Docker
- **Efficiency**: More efficient resource utilization than VMs
- **Scalability**: Easy to scale horizontally

## Docker Basics

### Essential Docker Commands

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Start a container
docker start <container_id>

# Stop a container
docker stop <container_id>

# Restart a container
docker restart <container_id>

# View container logs
docker logs <container_id>

# View container logs continuously
docker logs -f <container_id>

# Execute a command in a running container
docker exec -it <container_id> <command>

# Access a container's shell
docker exec -it <container_id> bash  # or sh for Alpine-based containers
```

### Docker Compose Basics

```bash
# Start all services defined in docker-compose.yml
docker-compose up -d

# Stop all services
docker-compose down

# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs <service_name>

# Rebuild and restart services
docker-compose up -d --build

# View service status
docker-compose ps
```

## MarkoTronix Container Architecture

Our system uses a microservices architecture with the following containers:

1. **hvac-ui**: Next.js frontend application
2. **api**: Mock API or FastAPI backend service
3. **mail-ingest**: Service for processing incoming emails
4. **offer-generation**: Service for generating and managing offers
5. **link-service**: Service for managing shareable links
6. **redis**: Message queue and caching
7. **postgres**: Database for persistent storage

### Container Relationships

```
hvac-ui → api
mail-ingest → redis, postgres
offer-generation → redis, postgres
link-service → redis, postgres
```

## Common Development Tasks

### Viewing Logs

```bash
# View UI container logs
docker-compose logs hvac-ui

# View API container logs
docker-compose logs api

# View logs for a specific service with follow
docker-compose logs -f mail-ingest
```

### Restarting Services

```bash
# Restart a specific service
docker-compose restart api

# Restart all services
docker-compose restart
```

### Accessing Container Shell

```bash
# Access UI container shell
docker-compose exec hvac-ui sh

# Access PostgreSQL container and connect to database
docker-compose exec postgres psql -U postgres hvac_crm
```

### Updating Code

When you make changes to the code:

1. For services with mounted volumes (development mode), changes are reflected automatically
2. For services without mounted volumes, rebuild the container:
   ```bash
   docker-compose up -d --build <service_name>
   ```

## Troubleshooting Containers

### Common Issues and Solutions

#### Container Won't Start

1. Check logs: `docker-compose logs <service_name>`
2. Verify environment variables in `.env` file
3. Check for port conflicts: `netstat -tuln | grep <port>`
4. Ensure dependencies are running: `docker-compose ps`

#### Container Health Check Failing

1. Check service endpoint manually: `curl http://localhost:<port>/health`
2. Verify network connectivity between containers
3. Check for resource constraints: `docker stats`

#### Database Connection Issues

1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check connection string in service configuration
3. Test connection manually:
   ```bash
   docker-compose exec postgres psql -U postgres -c "SELECT 1"
   ```

### Debugging Techniques

#### Inspecting Container Configuration

```bash
# View container details
docker inspect <container_id>

# View container environment variables
docker inspect --format '{{.Config.Env}}' <container_id>

# View container network settings
docker inspect --format '{{.NetworkSettings.Networks}}' <container_id>
```

#### Monitoring Resource Usage

```bash
# View resource usage for all containers
docker stats

# View resource usage for specific containers
docker stats <container_id_1> <container_id_2>
```

#### Network Debugging

```bash
# Check network connectivity from inside a container
docker-compose exec <service_name> ping <other_service_name>

# Check if a port is accessible
docker-compose exec <service_name> wget -O- <other_service_name>:<port>
```

## Container Health Monitoring

All containers have health checks configured to ensure they're running properly.

### Checking Container Health

```bash
# Check health status of all containers
docker inspect --format "{{.Name}}: {{.State.Health.Status}}" $(docker ps -q)

# View health check logs for a specific container
docker inspect --format "{{json .State.Health}}" <container_id> | jq
```

### Automated Monitoring

The system includes a monitoring script (`container-monitoring.js`) that checks container health and resource usage:

```bash
# Run the monitoring script
node container-monitoring.js
```

## Best Practices

1. **Always use docker-compose commands** rather than direct docker commands
2. **Check logs first** when troubleshooting issues
3. **Use health checks** to verify container status
4. **Monitor resource usage** to identify performance bottlenecks
5. **Keep base images updated** for security patches
6. **Document configuration changes** in version control
7. **Use environment variables** for configuration
8. **Back up volumes regularly** to prevent data loss

## Hands-On Exercises

### Exercise 1: Container Management

1. Start all containers: `docker-compose up -d`
2. Check container status: `docker-compose ps`
3. View logs for the UI container: `docker-compose logs hvac-ui`
4. Restart the API container: `docker-compose restart api`
5. Stop all containers: `docker-compose down`

### Exercise 2: Troubleshooting

1. Intentionally stop the Redis container: `docker-compose stop redis`
2. Observe how dependent services behave
3. Check logs to identify the issue: `docker-compose logs mail-ingest`
4. Restart Redis: `docker-compose start redis`
5. Verify services recover: `docker-compose ps`

### Exercise 3: Database Management

1. Access the PostgreSQL container: `docker-compose exec postgres psql -U postgres hvac_crm`
2. Run a simple query: `SELECT * FROM users LIMIT 5;`
3. Back up the database: `docker exec markotronix-postgres-1 pg_dump -U postgres hvac_crm > backup.sql`
4. Restore from backup: `cat backup.sql | docker exec -i markotronix-postgres-1 psql -U postgres hvac_crm`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Next.js Documentation](https://nextjs.org/docs)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Container Management Guide](./container-management.md)
2. Review the container test reports in the `logs` directory
3. Contact the DevOps team at devops@markotronix.example.com
