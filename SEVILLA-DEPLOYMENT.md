# MarkoTronix HVAC CRM/ERP Sevilla Deployment Guide

This guide provides instructions for deploying the MarkoTronix HVAC CRM/ERP system to Sevilla.

## Prerequisites

Before deploying to Sevilla, ensure you have the following:

1. **Sevilla CLI** installed and authenticated
2. **Node.js** version 18+ installed
3. **Docker** installed and running (for local testing)
4. **Nixpacks** installed (recommended for optimal builds)

## Configuration

### Environment Variables

Create or update the `.env.sevilla` file in the `hvac-ui` directory with your Sevilla-specific configuration:

```
# Sevilla Environment Configuration
NEXT_PUBLIC_API_URL=https://api.your-app.sevilla.app/api
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.your-app.sevilla.app/ws
API_URL=https://api.your-app.sevilla.app/api

# Authentication
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_AUTH_COOKIE_NAME=hvac_auth_token
JWT_SECRET=your_jwt_secret
AUTH_COOKIE_NAME=hvac_auth_token

# Application Environment
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Deployment
NEXT_PUBLIC_SITE_URL=https://your-app.sevilla.app
PORT=3000
HOST=0.0.0.0

# Sevilla Specific
SEVILLA_APP_NAME=your-app-name
SEVILLA_REGION=eu-central-1
CUSTOM_DOMAINS=your-domain.com,www.your-domain.com
```

### Nixpacks Configuration

The project includes optimized Nixpacks configuration files:

- `hvac-ui/nixpacks.toml` - Configuration for deploying just the frontend
- `nixpacks.toml` - Configuration for deploying the entire project (frontend + microservices)

## Deployment Options

### Option 1: Deploy Frontend Only

To deploy just the frontend to Sevilla:

```bash
# Navigate to the hvac-ui directory
cd hvac-ui

# Run the improved Sevilla deployment script
node deploy/deploy-to-sevilla-improved.js
```

### Option 2: Deploy Entire Project

To deploy the entire project (frontend + microservices) to Sevilla:

```bash
# From the project root
sevilla deploy --nixpacks --project your-project-name
```

## Testing Deployment Locally

Before deploying to Sevilla, you can test the deployment locally:

```bash
# From the project root
node test-sevilla-deploy.js
```

This script will:
1. Build and start all services in Docker containers
2. Configure them to work together
3. Check the health of each service
4. Display URLs and connection information

To clean up after testing:

```bash
node test-sevilla-deploy.js cleanup
```

## Deployment Process

The deployment process consists of the following steps:

1. **Preparation**:
   - Environment variables are set
   - Build artifacts are cleaned
   - Dependencies are installed

2. **Build**:
   - Frontend is built with Next.js
   - Icons are generated
   - TypeScript is compiled
   - Service worker is generated

3. **Deployment**:
   - Built application is uploaded to Sevilla
   - Sevilla configures the environment
   - Application is started on Sevilla's infrastructure

4. **Verification**:
   - Health checks are performed
   - Application is available at your Sevilla URL

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (should be 18+)
   - Ensure all dependencies are installed
   - Check for TypeScript errors

2. **Deployment Failures**:
   - Verify Sevilla CLI is authenticated
   - Check for network issues
   - Ensure you have sufficient permissions

3. **Runtime Issues**:
   - Check environment variables
   - Verify API endpoints are correct
   - Check health endpoints for specific errors

### Getting Help

If you encounter issues not covered in this guide:
- Check Sevilla documentation
- Run with verbose logging: `SEVILLA_DEBUG=true node deploy/deploy-to-sevilla-improved.js`
- Contact Sevilla support

## Custom Domains

To use custom domains with your Sevilla deployment:

1. Add domains to your `.env.sevilla` file:
   ```
   CUSTOM_DOMAINS=your-domain.com,www.your-domain.com
   ```

2. Configure DNS records for your domains:
   - Add a CNAME record pointing to `your-app.sevilla.app`

3. Deploy with the custom domains:
   ```bash
   node deploy/deploy-to-sevilla-improved.js
   ```

4. Sevilla will automatically provision SSL certificates for your domains

## Monitoring and Logs

Once deployed, you can monitor your application and view logs:

```bash
# View logs
sevilla logs --project your-project-name

# View metrics
sevilla metrics --project your-project-name
```

## Scaling

To scale your application on Sevilla:

```bash
# Scale to 3 instances
sevilla scale --project your-project-name --instances 3
```

## Rollback

If you need to rollback to a previous deployment:

```bash
# List deployments
sevilla deployments --project your-project-name

# Rollback to a specific deployment
sevilla rollback --project your-project-name --deployment deployment-id
```