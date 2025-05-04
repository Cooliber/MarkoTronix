#!/bin/bash

# Deployment configuration generator
# This script generates deployment configuration files for different platforms

# Exit on error
set -e

# Default values
PLATFORM=${1:-"all"}
OUTPUT_DIR=${2:-"./deploy"}

# Print usage information
function print_usage() {
  echo "Usage: $0 [PLATFORM] [OUTPUT_DIR]"
  echo "  PLATFORM: The deployment platform (default: all)"
  echo "            Valid values: all, sevilla, nixpacks, docker, docker-compose"
  echo "  OUTPUT_DIR: The directory to output configuration files (default: ./deploy)"
  echo ""
  echo "Example: $0 sevilla ./configs"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  print_usage
  exit 0
fi

# Validate platform
if [[ "$PLATFORM" != "all" && "$PLATFORM" != "sevilla" && "$PLATFORM" != "nixpacks" && "$PLATFORM" != "docker" && "$PLATFORM" != "docker-compose" ]]; then
  echo "Error: Invalid platform '$PLATFORM'"
  print_usage
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate Sevilla configuration
function generate_sevilla_config() {
  echo "Generating Sevilla configuration..."
  
  # Get application name from package.json
  APP_NAME=$(node -e "console.log(require('./package.json').name)")
  
  # Create Sevilla configuration file
  cat > "$OUTPUT_DIR/sevilla.config.js" << EOF
/**
 * Sevilla deployment configuration
 * This file is used by the Sevilla CLI to deploy the application
 */

module.exports = {
  // Application name in Sevilla
  name: process.env.SEVILLA_APP_NAME || '$APP_NAME',
  
  // Application type
  type: 'web',
  
  // Source directory (relative to this file)
  source: '../',
  
  // Build configuration
  build: {
    // Build command
    command: 'npm run build:sevilla',
    
    // Output directory
    outputDir: '.next',
    
    // Cache configuration
    cache: {
      // Directories to cache between builds
      directories: [
        'node_modules',
        '.next/cache'
      ]
    },
    
    // Environment variables to pass to the build
    env: {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  },
  
  // Runtime configuration
  runtime: {
    // Node.js version
    nodeVersion: '18.x',
    
    // Command to start the application
    command: 'npm run start:sevilla',
    
    // Port to expose
    port: process.env.PORT || 3000,
    
    // Health check configuration
    healthCheck: {
      path: '/api/health',
      interval: '30s',
      timeout: '5s',
      retries: 3
    },
    
    // Scaling configuration
    scaling: {
      minInstances: 1,
      maxInstances: 5,
      cpuThreshold: 80,
      memoryThreshold: 80
    },
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  },
  
  // Network configuration
  network: {
    // Custom domains
    domains: process.env.CUSTOM_DOMAINS ? process.env.CUSTOM_DOMAINS.split(',') : [],
    
    // CORS configuration
    cors: {
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400
    }
  },
  
  // Database configuration (if needed)
  database: {
    type: process.env.DB_TYPE || 'none',
    // Add database configuration if needed
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: true,
    logsRetentionDays: 7
  },
  
  // Hooks
  hooks: {
    // Pre-deploy hook
    preDeploy: 'npm run lint',
    
    // Post-deploy hook
    postDeploy: 'npm run test:e2e'
  }
};
EOF
  
  echo "Sevilla configuration generated at $OUTPUT_DIR/sevilla.config.js"
}

# Generate Nixpacks configuration
function generate_nixpacks_config() {
  echo "Generating Nixpacks configuration..."
  
  # Create Nixpacks configuration file
  cat > "$OUTPUT_DIR/nixpacks.toml" << EOF
# Nixpacks configuration for HVAC CRM UI
# This file is used by Nixpacks to build the application

[phases.setup]
nixPkgs = ["nodejs_18", "yarn", "gcc", "gnumake"]

[phases.install]
cmds = ["yarn install --frozen-lockfile"]

[phases.build]
cmds = ["yarn build"]

[start]
cmd = "yarn start"

[variables]
NODE_ENV = "production"
NEXT_TELEMETRY_DISABLED = "1"

# Cache directories between builds
[[cache]]
path = "node_modules"
key = "node_modules-{{ checksum 'yarn.lock' }}"

[[cache]]
path = ".next/cache"
key = "next-cache-{{ checksum 'yarn.lock' }}"
EOF
  
  echo "Nixpacks configuration generated at $OUTPUT_DIR/nixpacks.toml"
}

# Generate Docker configuration
function generate_docker_config() {
  echo "Generating Docker configuration..."
  
  # Create Dockerfile
  cat > "Dockerfile" << EOF
# Base Node.js image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  else npm install; \\
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy all files
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]
EOF
  
  echo "Docker configuration generated at Dockerfile"
}

# Generate Docker Compose configuration
function generate_docker_compose_config() {
  echo "Generating Docker Compose configuration..."
  
  # Create Docker Compose file
  cat > "$OUTPUT_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  # HVAC CRM UI
  hvac-ui:
    build:
      context: ..
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:8000/api
      - NEXT_PUBLIC_WEBSOCKET_URL=ws://api:8000/ws
      - API_URL=http://api:8000/api
      - NEXT_PUBLIC_N8N_URL=http://n8n:5678
      - N8N_URL=http://n8n:5678
      - NEXT_PUBLIC_ENABLE_N8N_INTEGRATION=true
    depends_on:
      - api
      - n8n
    networks:
      - hvac-network
    restart: unless-stopped

  # Mock API for development
  api:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ../mock-api:/app
    command: sh -c "npm install && npm start"
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - PORT=8000
    networks:
      - hvac-network
    restart: unless-stopped

  # n8n for workflow automation
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_USER_MANAGEMENT_DISABLED=true
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_HIRING_BANNER_ENABLED=false
      - N8N_VERSION_NOTIFICATIONS_ENABLED=false
      - WEBHOOK_URL=http://hvac-ui:3000/api/n8n/webhook
      - GENERIC_TIMEZONE=Europe/Warsaw
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - hvac-network
    restart: unless-stopped

  # Database for n8n (optional)
  db:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - hvac-network
    restart: unless-stopped

networks:
  hvac-network:
    driver: bridge

volumes:
  n8n_data:
  postgres_data:
EOF
  
  echo "Docker Compose configuration generated at $OUTPUT_DIR/docker-compose.yml"
}

# Generate configurations based on platform
case "$PLATFORM" in
  "all")
    generate_sevilla_config
    generate_nixpacks_config
    generate_docker_config
    generate_docker_compose_config
    ;;
  "sevilla")
    generate_sevilla_config
    ;;
  "nixpacks")
    generate_nixpacks_config
    ;;
  "docker")
    generate_docker_config
    ;;
  "docker-compose")
    generate_docker_compose_config
    ;;
esac

echo "Configuration generation complete!"