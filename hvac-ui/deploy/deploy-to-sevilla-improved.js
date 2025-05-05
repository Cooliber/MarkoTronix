/**
 * Improved Sevilla deployment script with better error handling and Nixpacks integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  appName: 'hvac-crm',
  envFile: '.env.sevilla',
  outputDir: '.next',
  region: 'eu-central-1',
  sevilla: {
    team: process.env.SEVILLA_TEAM || 'default',
    project: process.env.SEVILLA_PROJECT || 'hvac-crm',
  },
  customDomains: process.env.CUSTOM_DOMAINS ? process.env.CUSTOM_DOMAINS.split(',') : [],
};

// Utility functions
function log(message) {
  console.log(chalk.blue(`[Deploy] ${message}`));
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

// Check if required tools are installed
function checkRequirements() {
  log('Checking requirements...');
  
  // Check Node.js version
  const nodeVersionResult = execCommand('node --version', true);
  if (!nodeVersionResult.success) {
    logError('Node.js is required for deployment');
    return false;
  }
  
  const nodeVersion = nodeVersionResult.output.trim();
  log(`Node.js version: ${nodeVersion}`);
  
  // Check if Nixpacks is installed
  const nixpacksResult = execCommand('nixpacks --version', true);
  if (!nixpacksResult.success) {
    logWarning('Nixpacks is not installed. It\'s recommended for optimal builds.');
    logWarning('Install Nixpacks from: https://nixpacks.com/docs/install');
  } else {
    log(`Nixpacks version: ${nixpacksResult.output.trim()}`);
  }
  
  // Check if Sevilla CLI is installed
  const sevillaResult = execCommand('sevilla --version', true);
  if (!sevillaResult.success) {
    logError('Sevilla CLI is required for deployment');
    logError('Please install Sevilla CLI and authenticate');
    return false;
  }
  
  log(`Sevilla CLI version: ${sevillaResult.output.trim()}`);
  
  return true;
}

// Prepare environment for build
function prepareEnvironment() {
  log('Preparing environment...');
  
  // Check if environment file exists
  if (!fs.existsSync(CONFIG.envFile)) {
    logError(`Environment file ${CONFIG.envFile} not found`);
    return false;
  }
  
  // Copy environment file
  try {
    fs.copyFileSync(
      path.join(process.cwd(), CONFIG.envFile),
      path.join(process.cwd(), '.env.production')
    );
    logSuccess('Environment file copied successfully');
  } catch (error) {
    logError(`Failed to copy environment file: ${error.message}`);
    return false;
  }
  
  // Create a timestamp for the build
  const buildTime = new Date().toISOString();
  process.env.NEXT_PUBLIC_BUILD_TIME = buildTime;
  process.env.BUILD_TIME = buildTime;
  
  // Set version from package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    process.env.NEXT_PUBLIC_APP_VERSION = packageJson.version;
  } catch (error) {
    logWarning(`Could not read version from package.json: ${error.message}`);
    process.env.NEXT_PUBLIC_APP_VERSION = '0.1.0';
  }
  
  return true;
}

// Clean previous build artifacts
function cleanBuild() {
  log('Cleaning previous build artifacts...');
  
  const dirsToClean = ['.next', 'out'];
  
  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      try {
        if (process.platform === 'win32') {
          execCommand(`rmdir /s /q ${dir}`, true);
        } else {
          execCommand(`rm -rf ${dir}`, true);
        }
      } catch (error) {
        logWarning(`Could not clean ${dir}: ${error.message}`);
      }
    }
  }
  
  return true;
}

// Build the application
function buildApplication() {
  log('Building application...');
  
  // Generate icons first
  const iconsResult = execCommand('npm run generate-icons');
  if (!iconsResult.success) {
    logWarning('Icon generation failed, but continuing with build');
  }
  
  // Build for Sevilla
  const buildResult = execCommand('npm run build:sevilla');
  if (!buildResult.success) {
    logError('Build failed');
    return false;
  }
  
  logSuccess('Build completed successfully');
  return true;
}

// Deploy to Sevilla
function deployToSevilla() {
  log('Deploying to Sevilla...');
  
  // Check if we're using Nixpacks
  const useNixpacks = fs.existsSync('nixpacks.toml');
  
  let deployCommand = 'sevilla deploy';
  
  // Add team if specified
  if (CONFIG.sevilla.team !== 'default') {
    deployCommand += ` --team ${CONFIG.sevilla.team}`;
  }
  
  // Add project name
  deployCommand += ` --project ${CONFIG.sevilla.project}`;
  
  // Add region
  deployCommand += ` --region ${CONFIG.region}`;
  
  // Use Nixpacks if available
  if (useNixpacks) {
    deployCommand += ' --nixpacks';
  }
  
  // Add custom domains if specified
  if (CONFIG.customDomains.length > 0) {
    deployCommand += ` --domains ${CONFIG.customDomains.join(',')}`;
  }
  
  // Execute deployment
  const deployResult = execCommand(deployCommand);
  if (!deployResult.success) {
    logError('Deployment failed');
    return false;
  }
  
  logSuccess('Deployment to Sevilla completed successfully');
  return true;
}

// Main execution
async function main() {
  console.log(chalk.bold.blue('\n=== HVAC CRM Sevilla Deployment ===\n'));
  
  if (!checkRequirements()) {
    process.exit(1);
  }
  
  if (!prepareEnvironment()) {
    process.exit(1);
  }
  
  if (!cleanBuild()) {
    process.exit(1);
  }
  
  if (!buildApplication()) {
    process.exit(1);
  }
  
  if (!deployToSevilla()) {
    process.exit(1);
  }
  
  console.log(chalk.bold.green('\n=== Deployment Completed Successfully ===\n'));
  console.log(chalk.cyan('Your application should be available shortly at:'));
  console.log(chalk.cyan(`https://${CONFIG.sevilla.project}.sevilla.app`));
  
  if (CONFIG.customDomains.length > 0) {
    console.log(chalk.cyan('\nCustom domains:'));
    CONFIG.customDomains.forEach(domain => {
      console.log(chalk.cyan(`https://${domain}`));
    });
  }
}

main().catch(error => {
  logError('Unhandled error during deployment:');
  logError(error.message);
  process.exit(1);
});