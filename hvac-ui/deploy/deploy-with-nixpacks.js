/**
 * JavaScript version of the deploy-with-nixpacks script
 * This is more compatible with Windows environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  nixpacksConfig: './deploy/nixpacks.toml',
  appName: 'hvac-crm',
};

// Utility functions
function log(message) {
  console.log(`\x1b[36m[Deploy]\x1b[0m ${message}`);
}

function logSuccess(message) {
  console.log(`\x1b[32m[Success]\x1b[0m ${message}`);
}

function logError(message) {
  console.error(`\x1b[31m[Error]\x1b[0m ${message}`);
}

function execCommand(command) {
  log(`Executing: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: true }
    });
    return true;
  } catch (error) {
    logError(`Command failed: ${command}`);
    logError(error.message);
    return false;
  }
}

// Check if Nixpacks is installed
function checkNixpacks() {
  log('Checking if Nixpacks is installed...');
  try {
    execSync('nixpacks --version', { stdio: 'pipe' });
    logSuccess('Nixpacks is installed');
    return true;
  } catch (error) {
    logError('Nixpacks is not installed');
    log('Please install Nixpacks: https://nixpacks.com/docs/install');
    return false;
  }
}

// Build with Nixpacks
function buildWithNixpacks() {
  const env = process.env.ENV || 'production';
  log(`Building for ${env} environment...`);
  
  // Copy appropriate environment file
  const envFile = `.env.${env}`;
  if (fs.existsSync(envFile)) {
    log(`Using ${envFile} file`);
    fs.copyFileSync(envFile, '.env.production');
  } else {
    log(`Warning: ${envFile} file not found, using default .env file`);
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', '.env.production');
    }
  }
  
  // Build the application with Nixpacks
  const buildCommand = `nixpacks build . --config ${CONFIG.nixpacksConfig} --name ${CONFIG.appName}-${env}`;
  return execCommand(buildCommand);
}

// Run the container
function runContainer() {
  const env = process.env.ENV || 'production';
  log(`Running the container for ${env} environment...`);
  
  const port = process.env.PORT || '28000';
  const runCommand = `docker run -d --name ${CONFIG.appName}-${env} -p ${port}:3000 --env-file .env.production ${CONFIG.appName}-${env}`;
  
  if (execCommand(runCommand)) {
    logSuccess(`Your application is running at: http://localhost:${port}`);
    const containerId = execSync(`docker ps -q -f name=${CONFIG.appName}-${env}`).toString().trim();
    log(`Container ID: ${containerId}`);
    return true;
  }
  
  return false;
}

// Main execution
function main() {
  log('Starting deployment with Nixpacks...');
  
  if (!checkNixpacks()) {
    process.exit(1);
  }
  
  if (!buildWithNixpacks()) {
    process.exit(1);
  }
  
  if (!runContainer()) {
    process.exit(1);
  }
  
  logSuccess('Deployment script completed successfully!');
}

main();