#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting HVAC CRM System initialization...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
  cp .env.example .env
  echo -e "${GREEN}Created .env file. Please update it with your actual values.${NC}"
  echo -e "${RED}Initialization paused. Update your .env file and run this script again.${NC}"
  exit 1
fi

# Source the .env file
source .env

echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p services/nginx/conf
mkdir -p services/nginx/certs
mkdir -p services/nginx/logs
mkdir -p services/prometheus
mkdir -p services/grafana/provisioning/datasources
mkdir -p services/grafana/provisioning/dashboards

# Create Prometheus config
echo -e "${YELLOW}Creating Prometheus configuration...${NC}"
cat > services/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api'
    static_configs:
      - targets: ['api:8000']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# Create Nginx configuration
echo -e "${YELLOW}Creating Nginx configuration...${NC}"
cat > services/nginx/conf/default.conf << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name _;
    
    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    
    # API
    location /api/ {
        proxy_pass http://api:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # MinIO Console
    location /storage/ {
        proxy_pass http://storage:9001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Flower (Celery monitoring)
    location /flower/ {
        proxy_pass http://flower:5555/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # RedisInsight
    location /redis/ {
        proxy_pass http://redisinsight:8001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # n8n
    location /n8n/ {
        proxy_pass http://n8n:5678/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Grafana
    location /grafana/ {
        proxy_pass http://grafana:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Jaeger
    location /jaeger/ {
        proxy_pass http://jaeger:16686/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Mailhog (dev only)
    location /mailhog/ {
        proxy_pass http://mailhog:8025/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Generate self-signed SSL certificate for development
echo -e "${YELLOW}Generating self-signed SSL certificate for development...${NC}"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout services/nginx/certs/server.key \
  -out services/nginx/certs/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create Grafana datasource configuration
echo -e "${YELLOW}Creating Grafana datasource configuration...${NC}"
cat > services/grafana/provisioning/datasources/datasource.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Create a sample dashboard for Grafana
echo -e "${YELLOW}Creating sample Grafana dashboard...${NC}"
mkdir -p services/grafana/provisioning/dashboards
cat > services/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# Start the containers
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Create MinIO buckets
echo -e "${YELLOW}Creating MinIO buckets...${NC}"
docker-compose exec -T storage mc alias set myminio http://localhost:9000 "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"
docker-compose exec -T storage mc mb myminio/offers
docker-compose exec -T storage mc mb myminio/reports
docker-compose exec -T storage mc mb myminio/attachments
docker-compose exec -T storage mc policy set download myminio/offers
docker-compose exec -T storage mc policy set download myminio/reports

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec -T api alembic upgrade head

# Seed initial data if needed
echo -e "${YELLOW}Seeding initial data...${NC}"
docker-compose exec -T api python -m scripts.seed_data

echo -e "${GREEN}Initialization completed successfully!${NC}"
echo -e "${YELLOW}You can access the services at:${NC}"
echo -e "  - API: http://localhost:8000"
echo -e "  - MinIO Console: http://localhost:9001"
echo -e "  - Mailhog: http://localhost:8025"
echo -e "  - Flower: http://localhost:5555"
echo -e "  - RedisInsight: http://localhost:8001"
echo -e "  - n8n: http://localhost:5678"
echo -e "  - Grafana: http://localhost:3000"
echo -e "  - Jaeger: http://localhost:16686"
echo -e "${YELLOW}Default credentials are in your .env file.${NC}"