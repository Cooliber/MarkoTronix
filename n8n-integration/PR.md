# Add n8n Integration as Separate Module

## Description

This pull request adds n8n workflow automation as a separate module, allowing for independent deployment and maintenance of the workflow automation system. The n8n integration is now completely separated from the main application, which helps with:

1. Independent scaling of the workflow automation system
2. Simplified deployment of the main application
3. Better separation of concerns
4. Easier maintenance and updates

## Changes

- Created a new `n8n-integration` directory with:
  - README.md with detailed documentation
  - docker-compose.yml for containerized deployment
  - Sample workflow for email processing
  - Deployment script for easy management
  - Integration guide for setup and configuration
  - Environment configuration example

## How to Test

1. Clone the repository
2. Navigate to the `n8n-integration` directory
3. Run `./deploy.sh --start` to start the n8n integration
4. Access the n8n editor at http://localhost:5678
5. Import and test the sample workflows

## Related Issues

This PR addresses the request to separate n8n integration from the main application build process.

## Checklist

- [x] Documentation has been updated
- [x] Sample workflows have been created
- [x] Deployment script has been tested
- [x] Docker Compose configuration has been verified
- [x] Integration guide has been written