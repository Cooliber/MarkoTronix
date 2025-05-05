# HVAC CRM Production Deployment Guide

This guide provides instructions for deploying the HVAC CRM UI to production environments.

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Docker (if using containerized deployment)
- Access to production environment (server, cloud provider, etc.)

## Environment Configuration

1. Create a production environment file:

   ```bash
   cp .env.example .env.production
   ```

2. Update the `.env.production` file with your production values:
   - Set `NEXT_PUBLIC_API_URL` to your production API URL
   - Configure authentication secrets
   - Set `APP_ENV` to `production`
   - Configure other environment-specific settings

## Build Options

### Local Production Build

To create a production build locally:

```bash
# Install dependencies
npm install

# Generate icons and assets
npm run generate-icons

# Build for production
npm run build:prod

# Start the production server
npm run start
```

### Docker Production Build

To build and run using Docker:

```bash
# Build the Docker image
docker build -t hvac-crm-ui:latest .

# Run the container
docker run -p 3000:3000 --env-file .env.production hvac-crm-ui:latest
```

## Deployment Options

### Option 1: Server Deployment

1. Set up a server with Node.js installed
2. Clone the repository
3. Install dependencies: `npm install --production`
4. Build the application: `npm run build:prod`
5. Start the server: `npm run start`
6. Set up a process manager (PM2, systemd, etc.) to keep the application running

Example PM2 configuration:

```bash
pm2 start npm --name "hvac-crm" -- start
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

1. Build the Docker image as shown above
2. Push the image to a container registry
3. Deploy using Docker Compose or Kubernetes

Example Docker Compose file:

```yaml
version: '3'
services:
  hvac-ui:
    image: hvac-crm-ui:latest
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: always
```

### Option 3: Cloud Platform Deployment

#### Vercel

1. Connect your repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy using the Vercel CLI or GitHub integration

```bash
vercel --prod
```

#### AWS Elastic Beanstalk

1. Create an Elastic Beanstalk environment
2. Configure environment variables
3. Deploy using the AWS CLI or console

```bash
eb deploy
```

## Production Checklist

Before going live, ensure:

- [ ] All environment variables are properly set
- [ ] API endpoints are configured correctly
- [ ] SSL/TLS is enabled
- [ ] Security headers are configured
- [ ] Performance optimizations are enabled
- [ ] Error monitoring is set up
- [ ] Backups are configured
- [ ] Load testing has been performed

## Monitoring and Maintenance

- Set up monitoring for the application (e.g., New Relic, Datadog)
- Configure alerts for critical errors
- Implement a logging strategy
- Set up regular backups
- Plan for regular updates and maintenance

## Rollback Procedure

In case of deployment issues:

1. Identify the issue through logs and monitoring
2. Revert to the previous stable version
3. For Docker: `docker run -p 3000:3000 hvac-crm-ui:previous-tag`
4. For Vercel: Use the Vercel dashboard to rollback to a previous deployment
5. Analyze the issue and fix in a development environment before redeploying

## Security Considerations

- Regularly update dependencies
- Implement rate limiting
- Use secure cookies and HTTP-only flags
- Configure proper CORS settings
- Enable Content Security Policy
- Perform regular security audits

## Performance Optimization

- Enable caching for static assets
- Configure CDN for global distribution
- Optimize images and assets
- Implement code splitting
- Use server-side rendering where appropriate

## Support and Troubleshooting

For production support:

- Check application logs
- Verify environment variables
- Ensure API services are available
- Check for recent code changes
- Review server resources (CPU, memory, disk space)

## Contact

For additional support, contact the development team at support@yourdomain.com.