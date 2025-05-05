#!/bin/bash
# Production deployment script for MarkoTronix HVAC CRM/ERP System

set -e  # Exit on error

# Configuration
APP_NAME="markotronix-hvac"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VERSION="1.0.0"

echo "Starting production deployment for $APP_NAME v$VERSION"
echo "Build timestamp: $TIMESTAMP"

# 1. Set environment variables for the build
export NODE_ENV=production
export NEXT_PUBLIC_APP_VERSION=$VERSION
export NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME
export BUILD_TIME=$BUILD_TIME

# 2. Build the frontend
echo "Building frontend..."
cd hvac-ui
npm ci
npm run build:prod
cd ..

# 3. Build the microservices
echo "Building microservices..."

# Build mail-ingest-service
echo "Building mail-ingest-service..."
cd mail-ingest-service
docker build -t $APP_NAME/mail-ingest:$VERSION .
cd ..

# Build offer-generation
echo "Building offer-generation..."
cd offer-generation
docker build -t $APP_NAME/offer-generation:$VERSION .
cd ..

# Build link-service
echo "Building link-service..."
cd link-service
docker build -t $APP_NAME/link-service:$VERSION .
cd ..

# 4. Create production docker-compose file
echo "Creating production docker-compose file..."
cat > docker-compose.production.yml << EOL
version: '3.8'

services:
  # HVAC CRM UI
  hvac-ui:
    image: $APP_NAME/hvac-ui:$VERSION
    build:
      context: ./hvac-ui
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=\${API_URL:-http://api:8000/api}
      - NEXT_PUBLIC_WEBSOCKET_URL=\${WEBSOCKET_URL:-ws://api:8000/ws}
      - API_URL=\${API_URL:-http://api:8000/api}
      - APP_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - NEXT_PUBLIC_APP_VERSION=$VERSION
      - NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME
    depends_on:
      - api
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
      
  # Prometheus for monitoring
  prometheus:
    image: prom/prometheus:v2.45.0
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./infra/prometheus/alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
      
  # Grafana for visualization
  grafana:
    image: grafana/grafana:10.0.3
    volumes:
      - grafana-data:/var/lib/grafana
      - ./infra/grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  # API Server
  api:
    image: $APP_NAME/api:$VERSION
    build:
      context: ./hvac-ui/mock-api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - PORT=8000
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  # Mail Ingest Service
  mail-ingest:
    image: $APP_NAME/mail-ingest:$VERSION
    volumes:
      - mail-attachments:/app/attachments
    ports:
      - "8001:8000"
    env_file:
      - ./mail-ingest-service/.env.production
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hvac_crm
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=production
    depends_on:
      - redis
      - postgres
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  # Offer Generation Service
  offer-generation:
    image: $APP_NAME/offer-generation:$VERSION
    volumes:
      - offer-storage:/app/storage
    ports:
      - "8002:8000"
    env_file:
      - ./offer-generation/.env.production
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hvac_crm
      - REDIS_URL=redis://redis:6379/0
      - STORAGE_DIR=/app/storage
      - ENVIRONMENT=production
    depends_on:
      - redis
      - postgres
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  # Link Service
  link-service:
    image: $APP_NAME/link-service:$VERSION
    volumes:
      - link-storage:/app/storage
    ports:
      - "8003:8000"
    env_file:
      - ./link-service/.env.production
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hvac_crm
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=\${SECRET_KEY:-change-me-in-production}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - ENVIRONMENT=production
    depends_on:
      - redis
      - postgres
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  # Redis for message queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  # PostgreSQL for production
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: hvac_crm
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - hvac-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

networks:
  hvac-network:
    driver: bridge

volumes:
  mail-attachments:
  offer-storage:
  link-storage:
  redis-data:
  postgres-data:
  prometheus-data:
  grafana-data:
EOL

# 5. Create production environment files
echo "Creating production environment files..."

# Create mail-ingest-service .env.production if it doesn't exist
if [ ! -f mail-ingest-service/.env.production ]; then
  echo "Creating mail-ingest-service/.env.production..."
  cp mail-ingest-service/.env.example mail-ingest-service/.env.production
  echo "LOG_LEVEL=INFO" >> mail-ingest-service/.env.production
  echo "ENVIRONMENT=production" >> mail-ingest-service/.env.production
fi

# Create offer-generation .env.production if it doesn't exist
if [ ! -f offer-generation/.env.production ]; then
  echo "Creating offer-generation/.env.production..."
  cp offer-generation/.env.example offer-generation/.env.production
  echo "LOG_LEVEL=INFO" >> offer-generation/.env.production
  echo "ENVIRONMENT=production" >> offer-generation/.env.production
fi

# Create link-service .env.production if it doesn't exist
if [ ! -f link-service/.env.production ]; then
  echo "Creating link-service/.env.production..."
  cp link-service/.env.example link-service/.env.production
  echo "LOG_LEVEL=INFO" >> link-service/.env.production
  echo "ENVIRONMENT=production" >> link-service/.env.production
fi

# 6. Build the frontend Docker image
echo "Building frontend Docker image..."
cd hvac-ui
docker build -t $APP_NAME/hvac-ui:$VERSION -f Dockerfile.prod .
cd ..

# 7. Build the API Docker image
echo "Building API Docker image..."
cd hvac-ui/mock-api
docker build -t $APP_NAME/api:$VERSION .
cd ../..

echo "Deployment preparation complete!"
echo "To start the production environment, run:"
echo "docker-compose -f docker-compose.production.yml up -d"
echo ""
echo "To stop the production environment, run:"
echo "docker-compose -f docker-compose.production.yml down"