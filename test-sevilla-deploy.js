/**
 * Test script for Sevilla deployment
 * This script simulates a Sevilla deployment locally to test the build process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  appName: 'markotronix-hvac',
  frontendPort: 28000,
  mailIngestPort: 28001,
  offerGenerationPort: 28002,
  linkServicePort: 28003,
  mockApiPort: 28004,
  postgresPort: 25432,
  redisPort: 26379,
};

// Utility functions
function log(message) {
  console.log(chalk.blue(`[Test] ${message}`));
}

function logSuccess(message) {
  console.log(chalk.green(`[Success] ${message}`));
}

function logError(message) {
  console.error(chalk.red(`[Error] ${message}`));
}

function logWarning(message) {
  console.warn(chalk.yellow(`[Warning] ${message}`));
}

function execCommand(command, silent = false) {
  log(`Executing: ${command}`);
  try {
    const options = { 
      env: { ...process.env, FORCE_COLOR: true }
    };
    
    if (!silent) {
      options.stdio = 'inherit';
    }
    
    const output = execSync(command, options);
    return { success: true, output: silent ? output.toString() : null };
  } catch (error) {
    logError(`Command failed: ${command}`);
    logError(error.message);
    return { success: false, error };
  }
}

// Check if Docker is running
function checkDocker() {
  log('Checking if Docker is running...');
  
  const dockerResult = execCommand('docker info', true);
  if (!dockerResult.success) {
    logError('Docker is required and must be running');
    return false;
  }
  
  logSuccess('Docker is running');
  return true;
}

// Clean up existing containers
function cleanupContainers() {
  log('Cleaning up existing containers...');
  
  const containers = [
    `${CONFIG.appName}-frontend`,
    `${CONFIG.appName}-mail-ingest`,
    `${CONFIG.appName}-offer-generation`,
    `${CONFIG.appName}-link-service`,
    `${CONFIG.appName}-mock-api`,
    `${CONFIG.appName}-postgres`,
    `${CONFIG.appName}-redis`,
  ];
  
  for (const container of containers) {
    // Check if container exists
    const checkResult = execCommand(`docker ps -a -q -f name=${container}`, true);
    
    if (checkResult.success && checkResult.output.trim()) {
      // Stop container if it's running
      execCommand(`docker stop ${container}`, true);
      
      // Remove container
      execCommand(`docker rm ${container}`, true);
    }
  }
  
  logSuccess('Containers cleaned up');
  return true;
}

// Start supporting services (PostgreSQL and Redis)
function startSupportingServices() {
  log('Starting supporting services...');
  
  // Start PostgreSQL
  const postgresResult = execCommand(`
    docker run -d --name ${CONFIG.appName}-postgres \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=hvac_crm \
      -p ${CONFIG.postgresPort}:5432 \
      postgres:15-alpine
  `, true);
  
  if (!postgresResult.success) {
    logError('Failed to start PostgreSQL');
    return false;
  }
  
  // Start Redis
  const redisResult = execCommand(`
    docker run -d --name ${CONFIG.appName}-redis \
      -p ${CONFIG.redisPort}:6379 \
      redis:7-alpine
  `, true);
  
  if (!redisResult.success) {
    logError('Failed to start Redis');
    return false;
  }
  
  logSuccess('Supporting services started');
  return true;
}

// Build and start the frontend
function buildAndStartFrontend() {
  log('Building and starting frontend...');
  
  // Copy Sevilla environment file
  try {
    fs.copyFileSync(
      path.join(process.cwd(), 'hvac-ui', '.env.sevilla'),
      path.join(process.cwd(), 'hvac-ui', '.env.production')
    );
  } catch (error) {
    logError(`Failed to copy environment file: ${error.message}`);
    return false;
  }
  
  // Build the frontend Docker image
  const buildResult = execCommand(`
    docker build -t ${CONFIG.appName}-frontend -f hvac-ui/Dockerfile.prod hvac-ui
  `);
  
  if (!buildResult.success) {
    logError('Failed to build frontend');
    return false;
  }
  
  // Start the frontend container
  const startResult = execCommand(`
    docker run -d --name ${CONFIG.appName}-frontend \
      -p ${CONFIG.frontendPort}:3000 \
      -e NODE_ENV=production \
      -e NEXT_PUBLIC_API_URL=http://localhost:${CONFIG.mockApiPort}/api \
      ${CONFIG.appName}-frontend
  `);
  
  if (!startResult.success) {
    logError('Failed to start frontend');
    return false;
  }
  
  logSuccess('Frontend built and started');
  return true;
}

// Build and start the microservices
function buildAndStartMicroservices() {
  log('Building and starting microservices...');
  
  // Build and start mail-ingest service
  const mailIngestResult = execCommand(`
    docker build -t ${CONFIG.appName}-mail-ingest mail-ingest-service && \
    docker run -d --name ${CONFIG.appName}-mail-ingest \
      -p ${CONFIG.mailIngestPort}:8000 \
      -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:${CONFIG.postgresPort}/hvac_crm \
      -e REDIS_URL=redis://host.docker.internal:${CONFIG.redisPort}/0 \
      -e ENVIRONMENT=production \
      ${CONFIG.appName}-mail-ingest
  `);
  
  if (!mailIngestResult.success) {
    logError('Failed to build and start mail-ingest service');
    return false;
  }
  
  // Build and start offer-generation service
  const offerGenerationResult = execCommand(`
    docker build -t ${CONFIG.appName}-offer-generation offer-generation && \
    docker run -d --name ${CONFIG.appName}-offer-generation \
      -p ${CONFIG.offerGenerationPort}:8000 \
      -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:${CONFIG.postgresPort}/hvac_crm \
      -e REDIS_URL=redis://host.docker.internal:${CONFIG.redisPort}/0 \
      -e ENVIRONMENT=production \
      ${CONFIG.appName}-offer-generation
  `);
  
  if (!offerGenerationResult.success) {
    logError('Failed to build and start offer-generation service');
    return false;
  }
  
  // Build and start link-service
  const linkServiceResult = execCommand(`
    docker build -t ${CONFIG.appName}-link-service link-service && \
    docker run -d --name ${CONFIG.appName}-link-service \
      -p ${CONFIG.linkServicePort}:8000 \
      -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:${CONFIG.postgresPort}/hvac_crm \
      -e REDIS_URL=redis://host.docker.internal:${CONFIG.redisPort}/0 \
      -e ENVIRONMENT=production \
      ${CONFIG.appName}-link-service
  `);
  
  if (!linkServiceResult.success) {
    logError('Failed to build and start link-service');
    return false;
  }
  
  // Build and start mock API
  const mockApiResult = execCommand(`
    docker build -t ${CONFIG.appName}-mock-api -f hvac-ui/mock-api/Dockerfile hvac-ui/mock-api && \
    docker run -d --name ${CONFIG.appName}-mock-api \
      -p ${CONFIG.mockApiPort}:8000 \
      -e NODE_ENV=production \
      -e PORT=8000 \
      ${CONFIG.appName}-mock-api
  `);
  
  if (!mockApiResult.success) {
    logError('Failed to build and start mock API');
    return false;
  }
  
  logSuccess('Microservices built and started');
  return true;
}

// Check service health
function checkServiceHealth() {
  log('Checking service health...');
  
  // Wait for services to start
  log('Waiting for services to start (30 seconds)...');
  execCommand('sleep 30', true);
  
  // Check frontend health
  log('Checking frontend health...');
  const frontendResult = execCommand(`curl -s http://localhost:${CONFIG.frontendPort}/api/health`, true);
  
  if (frontendResult.success) {
    logSuccess('Frontend is healthy');
  } else {
    logWarning('Frontend health check failed');
  }
  
  // Check mail-ingest health
  log('Checking mail-ingest health...');
  const mailIngestResult = execCommand(`curl -s http://localhost:${CONFIG.mailIngestPort}/health`, true);
  
  if (mailIngestResult.success) {
    logSuccess('Mail-ingest service is healthy');
  } else {
    logWarning('Mail-ingest health check failed');
  }
  
  // Check offer-generation health
  log('Checking offer-generation health...');
  const offerGenerationResult = execCommand(`curl -s http://localhost:${CONFIG.offerGenerationPort}/health`, true);
  
  if (offerGenerationResult.success) {
    logSuccess('Offer-generation service is healthy');
  } else {
    logWarning('Offer-generation health check failed');
  }
  
  // Check link-service health
  log('Checking link-service health...');
  const linkServiceResult = execCommand(`curl -s http://localhost:${CONFIG.linkServicePort}/health`, true);
  
  if (linkServiceResult.success) {
    logSuccess('Link-service is healthy');
  } else {
    logWarning('Link-service health check failed');
  }
  
  // Check mock API health
  log('Checking mock API health...');
  const mockApiResult = execCommand(`curl -s http://localhost:${CONFIG.mockApiPort}/api/health`, true);
  
  if (mockApiResult.success) {
    logSuccess('Mock API is healthy');
  } else {
    logWarning('Mock API health check failed');
  }
  
  return true;
}

// Display service information
function displayServiceInfo() {
  console.log(chalk.bold.cyan('\n=== Service Information ===\n'));
  
  console.log(chalk.cyan('Frontend:'));
  console.log(`  URL: http://localhost:${CONFIG.frontendPort}`);
  console.log(`  Health: http://localhost:${CONFIG.frontendPort}/api/health`);
  
  console.log(chalk.cyan('\nMail Ingest Service:'));
  console.log(`  URL: http://localhost:${CONFIG.mailIngestPort}`);
  console.log(`  Health: http://localhost:${CONFIG.mailIngestPort}/health`);
  
  console.log(chalk.cyan('\nOffer Generation Service:'));
  console.log(`  URL: http://localhost:${CONFIG.offerGenerationPort}`);
  console.log(`  Health: http://localhost:${CONFIG.offerGenerationPort}/health`);
  
  console.log(chalk.cyan('\nLink Service:'));
  console.log(`  URL: http://localhost:${CONFIG.linkServicePort}`);
  console.log(`  Health: http://localhost:${CONFIG.linkServicePort}/health`);
  
  console.log(chalk.cyan('\nMock API:'));
  console.log(`  URL: http://localhost:${CONFIG.mockApiPort}`);
  console.log(`  Health: http://localhost:${CONFIG.mockApiPort}/api/health`);
  
  console.log(chalk.cyan('\nPostgreSQL:'));
  console.log(`  Port: ${CONFIG.postgresPort}`);
  console.log('  Connection: postgresql://postgres:postgres@localhost:${CONFIG.postgresPort}/hvac_crm');
  
  console.log(chalk.cyan('\nRedis:'));
  console.log(`  Port: ${CONFIG.redisPort}`);
  console.log(`  Connection: redis://localhost:${CONFIG.redisPort}/0`);
  
  console.log(chalk.bold.cyan('\n=== Cleanup Instructions ===\n'));
  console.log('To stop and remove all containers, run:');
  console.log(chalk.cyan(`node test-sevilla-deploy.js cleanup`));
}

// Cleanup all containers
function cleanup() {
  log('Cleaning up all containers...');
  
  cleanupContainers();
  
  logSuccess('All containers cleaned up');
  return true;
}

// Main execution
async function main() {
  console.log(chalk.bold.blue('\n=== MarkoTronix HVAC CRM Sevilla Deployment Test ===\n'));
  
  // Check if cleanup command was passed
  if (process.argv.length > 2 && process.argv[2] === 'cleanup') {
    cleanup();
    return;
  }
  
  if (!checkDocker()) {
    process.exit(1);
  }
  
  if (!cleanupContainers()) {
    process.exit(1);
  }
  
  if (!startSupportingServices()) {
    process.exit(1);
  }
  
  if (!buildAndStartFrontend()) {
    process.exit(1);
  }
  
  if (!buildAndStartMicroservices()) {
    process.exit(1);
  }
  
  if (!checkServiceHealth()) {
    process.exit(1);
  }
  
  displayServiceInfo();
  
  console.log(chalk.bold.green('\n=== Test Deployment Completed Successfully ===\n'));
}

main().catch(error => {
  logError('Unhandled error during test deployment:');
  logError(error.message);
  process.exit(1);
});