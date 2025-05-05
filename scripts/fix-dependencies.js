#!/usr/bin/env node

/**
 * This script fixes dependency issues in the project by:
 * 1. Cleaning node_modules directories
 * 2. Updating package.json files with correct dependencies
 * 3. Reinstalling dependencies with proper caching
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const hvacUiDir = path.join(rootDir, 'hvac-ui');
const packageJsonPath = path.join(rootDir, 'package.json');
const hvacUiPackageJsonPath = path.join(hvacUiDir, 'package.json');

// Utility functions
function log(message) {
  console.log(`\x1b[36m[Dependency Fix]\x1b[0m ${message}`);
}

function logSuccess(message) {
  console.log(`\x1b[32m[Success]\x1b[0m ${message}`);
}

function logError(message) {
  console.error(`\x1b[31m[Error]\x1b[0m ${message}`);
}

function execCommand(command, cwd = rootDir) {
  log(`Executing: ${command}`);
  try {
    execSync(command, { 
      cwd, 
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

// Main functions
function cleanNodeModules() {
  log('Cleaning node_modules directories...');
  
  // Remove root node_modules
  if (fs.existsSync(path.join(rootDir, 'node_modules'))) {
    log('Removing root node_modules...');
    execCommand('rmdir /s /q node_modules');
  }
  
  // Remove hvac-ui node_modules
  if (fs.existsSync(path.join(hvacUiDir, 'node_modules'))) {
    log('Removing hvac-ui node_modules...');
    execCommand('rmdir /s /q node_modules', hvacUiDir);
  }
  
  // Clear npm cache
  log('Clearing npm cache...');
  execCommand('npm cache clean --force');
  
  logSuccess('Node modules cleaned successfully');
}

function updatePackageJson() {
  log('Updating package.json files...');
  
  // Update root package.json
  const rootPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Ensure workspaces are properly configured
  rootPackageJson.workspaces = ['hvac-ui'];
  
  // Update dependencies that should be at the root level
  rootPackageJson.dependencies = {
    "react-toastify": "^11.0.5"
  };
  
  rootPackageJson.devDependencies = {
    "cross-env": "^7.0.3",
    "rimraf": "^5.0.5",
    "npm-check-updates": "^16.14.18"
  };
  
  // Add clean-install script
  rootPackageJson.scripts = {
    ...rootPackageJson.scripts,
    "clean-install": "node scripts/fix-dependencies.js",
    "update-deps": "npx npm-check-updates -u && cd hvac-ui && npx npm-check-updates -u"
  };
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(rootPackageJson, null, 2));
  
  // Update hvac-ui package.json
  const hvacUiPackageJson = JSON.parse(fs.readFileSync(hvacUiPackageJsonPath, 'utf8'));
  
  // Fix React version to avoid conflicts
  if (hvacUiPackageJson.dependencies.react) {
    hvacUiPackageJson.dependencies.react = "^18.2.0";
  }
  
  if (hvacUiPackageJson.dependencies["react-dom"]) {
    hvacUiPackageJson.dependencies["react-dom"] = "^18.2.0";
  }
  
  // Write updated package.json
  fs.writeFileSync(hvacUiPackageJsonPath, JSON.stringify(hvacUiPackageJson, null, 2));
  
  logSuccess('Package.json files updated successfully');
}

function reinstallDependencies() {
  log('Reinstalling dependencies...');
  
  // Install dependencies at the root level
  log('Installing root dependencies...');
  if (!execCommand('npm install --no-fund --no-audit')) {
    logError('Failed to install root dependencies');
    return false;
  }
  
  logSuccess('Dependencies reinstalled successfully');
  return true;
}

function runTests() {
  log('Running tests to verify installation...');
  
  // Run a simple test to verify the installation
  if (!execCommand('npm run lint')) {
    logError('Tests failed. Please check the errors above.');
    return false;
  }
  
  logSuccess('Tests passed successfully');
  return true;
}

// Main execution
function main() {
  log('Starting dependency fix process...');
  
  cleanNodeModules();
  updatePackageJson();
  
  if (reinstallDependencies()) {
    log('Dependency fix completed successfully!');
    log('To run the application, use: npm run dev');
  } else {
    logError('Dependency fix failed. Please check the errors above.');
    process.exit(1);
  }
}

main();