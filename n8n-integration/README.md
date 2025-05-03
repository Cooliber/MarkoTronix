# n8n Integration for MarkoTronix HVAC CRM

This directory contains the n8n workflows and configuration for integrating with the MarkoTronix HVAC CRM system.

## Overview

n8n is used to automate various business processes in the HVAC CRM system, including:

- Email processing and categorization
- Service order creation from emails
- Client notification for service appointments
- Warranty card generation and delivery
- Integration with external systems (e.g., accounting, inventory)
- Automated reporting and analytics

## Setup

The n8n integration is designed to be deployed separately from the main application. This allows for independent scaling and maintenance of the workflow automation system.

### Prerequisites

- n8n server (v1.0.0+)
- Access to the HVAC CRM API
- SMTP server for email notifications
- (Optional) S3-compatible storage for file attachments

### Installation

1. Install n8n:
   ```bash
   npm install n8n -g
   ```

2. Start n8n:
   ```bash
   n8n start
   ```

3. Import the workflows from the `workflows` directory.

## Configuration

The n8n integration requires the following environment variables:

- `N8N_HVAC_API_URL`: URL of the HVAC CRM API
- `N8N_HVAC_API_KEY`: API key for authentication
- `N8N_SMTP_HOST`: SMTP server hostname
- `N8N_SMTP_PORT`: SMTP server port
- `N8N_SMTP_USER`: SMTP server username
- `N8N_SMTP_PASS`: SMTP server password
- `N8N_S3_ENDPOINT`: S3 endpoint URL
- `N8N_S3_ACCESS_KEY`: S3 access key
- `N8N_S3_SECRET_KEY`: S3 secret key
- `N8N_S3_BUCKET`: S3 bucket name

## Workflows

The following workflows are included:

- `email-processor.json`: Processes incoming emails and creates service orders
- `appointment-reminder.json`: Sends appointment reminders to clients
- `warranty-generator.json`: Generates and sends warranty cards
- `report-generator.json`: Generates and sends reports
- `inventory-sync.json`: Synchronizes inventory with external systems

## Development

To develop new workflows:

1. Start n8n in development mode:
   ```bash
   n8n start --tunnel
   ```

2. Access the n8n editor at `http://localhost:5678`

3. Create and test your workflows

4. Export the workflows to the `workflows` directory

## Deployment

The n8n integration can be deployed using Docker:

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_HVAC_API_URL=https://api.example.com \
  -e N8N_HVAC_API_KEY=your-api-key \
  -e N8N_SMTP_HOST=smtp.example.com \
  -e N8N_SMTP_PORT=587 \
  -e N8N_SMTP_USER=user@example.com \
  -e N8N_SMTP_PASS=your-password \
  -e N8N_S3_ENDPOINT=https://s3.example.com \
  -e N8N_S3_ACCESS_KEY=your-access-key \
  -e N8N_S3_SECRET_KEY=your-secret-key \
  -e N8N_S3_BUCKET=your-bucket \
  n8nio/n8n
```

## Integration with HVAC CRM

The n8n integration communicates with the HVAC CRM system through the API. The following endpoints are used:

- `/api/clients`: Client management
- `/api/service-orders`: Service order management
- `/api/appointments`: Appointment management
- `/api/warranties`: Warranty management
- `/api/inventory`: Inventory management
- `/api/reports`: Report management

## License

This project is proprietary and confidential.