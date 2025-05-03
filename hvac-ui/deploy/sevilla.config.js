/**
 * Sevilla deployment configuration
 * This file contains configuration for deploying the application to Sevilla platform
 */

module.exports = {
  // Application name
  name: 'hvac-crm',
  
  // Application type
  type: 'web',
  
  // Application version
  version: process.env.APP_VERSION || '1.0.0',
  
  // Application environment
  environment: process.env.APP_ENV || 'production',
  
  // Deployment region
  region: process.env.DEPLOY_REGION || 'eu-central-1',
  
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