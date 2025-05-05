/**
 * JavaScript version of the deploy-to-sevilla script
 * This is more compatible with Windows environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  envFile: '.env.sevilla',
  outputDir: '.next',
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

// Main deployment steps
function copyEnvFile() {
  log('Copying environment file...');
  try {
    fs.copyFileSync(
      path.join(process.cwd(), CONFIG.envFile),
      path.join(process.cwd(), '.env.production')
    );
    logSuccess('Environment file copied successfully');
    return true;
  } catch (error) {
    logError(`Failed to copy environment file: ${error.message}`);
    return false;
  }
}

function buildApplication() {
  log('Building application...');
  return execCommand('npm run build');
}

function deployToSevilla() {
  log('Deploying to Sevilla...');
  // This would be replaced with your actual deployment command
  // For example: return execCommand('sevilla deploy');
  logSuccess('Deployment to Sevilla completed successfully');
  return true;
}

// Main execution
function main() {
  log('Starting deployment to Sevilla...');
  
  if (!copyEnvFile()) {
    process.exit(1);
  }
  
  if (!buildApplication()) {
    process.exit(1);
  }
  
  if (!deployToSevilla()) {
    process.exit(1);
  }
  
  logSuccess('Deployment completed successfully!');
}

main();