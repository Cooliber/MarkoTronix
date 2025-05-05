# Dependency Management Guide

This document provides guidelines for managing dependencies in the MarkoTronix HVAC CRM project.

## Project Structure

The project uses npm workspaces with the following structure:

- Root project (`markotronix-hvac-crm`)
  - Frontend UI (`hvac-ui`)

## Dependency Management Commands

### Clean Installation

To perform a clean installation of all dependencies:

```bash
npm run clean:install
```

This command:
1. Removes all node_modules directories
2. Reinstalls dependencies based on package.json files

### Fix Dependency Issues

If you encounter dependency conflicts or issues:

```bash
npm run fix:deps
```

This script:
1. Cleans all node_modules directories
2. Updates package.json files to resolve conflicts
3. Reinstalls dependencies with proper configuration

### Update Dependencies

To check for and update dependencies to their latest versions:

```bash
npm run update:deps
```

## Best Practices

### Adding Dependencies

- Add UI-related dependencies to the `hvac-ui` package
- Add build tools and shared dependencies to the root package
- Use exact versions for critical dependencies (e.g., React)

```bash
# Add a dependency to hvac-ui
cd hvac-ui
npm install some-package

# Add a shared dependency to the root
npm install -W some-shared-package
```

### Resolving Conflicts

1. Check for peer dependency warnings in the npm output
2. Use the `fix:deps` script to automatically resolve common issues
3. For manual fixes:
   - Ensure React and React DOM versions are fixed at 18.2.0
   - Check for duplicate dependencies across packages
   - Use `npm ls package-name` to check installed versions

### Version Control

- Always commit package.json and package-lock.json files together
- Run tests after dependency updates before committing

## Common Issues and Solutions

### React Version Conflicts

The project uses React 18.2.0. If you see warnings about React version conflicts:

```bash
npm run fix:deps
```

### Installation Errors

If you encounter ENOTEMPTY or other installation errors:

```bash
npm run clean:modules
npm cache clean --force
npm install
```

### Workspace Issues

If workspace dependencies aren't resolving correctly:

```bash
npm install -W
```

## Docker Considerations

When building Docker images, dependencies are installed during the build process. Ensure your Dockerfile:

1. Copies package.json files first
2. Installs dependencies
3. Copies the rest of the application code

This approach leverages Docker's layer caching for faster builds.