# HVAC UI Installation Guide

This guide provides instructions for installing and setting up the HVAC UI application.

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

## Installation Options

### Option 1: Standard Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Using the Fix Script (Recommended for Windows)

If you encounter installation issues, use the provided fix script:

```bash
# Run the fix script
fix-install.bat
```

This script will:
1. Clean the npm cache
2. Remove package-lock.json if it exists
3. Reinstall dependencies

### Option 3: Manual Fix

If you're still experiencing issues, try these steps manually:

```bash
# Exit any virtual environments (if applicable)
# For Python virtual environments, use:
deactivate

# Clean npm cache
npm cache clean --force

# Remove package-lock.json
del package-lock.json

# Install dependencies with no fund/audit
npm install --no-fund --no-audit
```

## Common Issues and Solutions

### Issue: "Cannot read properties of null (reading 'location')"

This error typically occurs when:
- Using npm within a Python virtual environment
- Having a corrupted package-lock.json file
- Using an incompatible npm version

**Solution:**
1. Exit the virtual environment
2. Run the fix-install.bat script
3. If issues persist, try using a different npm version:
   ```bash
   npm install -g npm@8.19.3
   npm cache clean --force
   npm install
   ```

### Issue: Dependency conflicts

If you see warnings about peer dependencies:

**Solution:**
1. Try installing with legacy peer deps:
   ```bash
   npm install --legacy-peer-deps
   ```

### Issue: Canvas installation problems

The canvas package requires additional system dependencies:

**Windows Solution:**
1. Install Visual Studio Build Tools
2. Run: `npm install --global --production windows-build-tools`
3. Then try installing again

**Linux Solution:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## Development

After successful installation:

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build:prod
```

## Troubleshooting

If you continue to experience issues:

1. Check Node.js and npm versions:
   ```bash
   node -v
   npm -v
   ```

2. Try using a Node version manager like nvm to switch Node versions

3. Contact the development team for further assistance