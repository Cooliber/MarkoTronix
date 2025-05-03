# n8n Integration Guide for MarkoTronix HVAC CRM

This guide explains how to integrate the n8n workflow automation system with the MarkoTronix HVAC CRM system.

## Overview

The n8n integration provides workflow automation for various business processes in the HVAC CRM system. It is designed to be deployed separately from the main application, allowing for independent scaling and maintenance.

## Architecture

The integration architecture consists of:

1. **n8n Server**: Runs the workflow automation engine
2. **PostgreSQL Database**: Stores workflow data and execution history
3. **API Integration**: Connects to the HVAC CRM API for data exchange
4. **Email Integration**: Processes incoming emails and sends notifications
5. **File Storage Integration**: Stores and retrieves files from S3-compatible storage

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Access to the HVAC CRM API
- SMTP server for email notifications
- (Optional) S3-compatible storage for file attachments

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Cooliber/MarkoTronix.git
   cd MarkoTronix/n8n-integration
   ```

2. Create the environment file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration:
   ```
   # n8n Configuration
   N8N_HOST=your-hostname
   N8N_PORT=5678
   N8N_PROTOCOL=http
   N8N_ENCRYPTION_KEY=your-secret-encryption-key

   # HVAC CRM API Configuration
   N8N_HVAC_API_URL=https://your-api-url/api
   N8N_HVAC_API_KEY=your-api-key

   # SMTP Configuration
   N8N_SMTP_HOST=smtp.example.com
   N8N_SMTP_PORT=587
   N8N_SMTP_USER=user@example.com
   N8N_SMTP_PASS=your-password

   # S3 Configuration
   N8N_S3_ENDPOINT=https://s3.example.com
   N8N_S3_ACCESS_KEY=your-access-key
   N8N_S3_SECRET_KEY=your-secret-key
   N8N_S3_BUCKET=your-bucket
   ```

4. Start the n8n integration:
   ```bash
   ./deploy.sh --start
   ```

5. Access the n8n editor at `http://your-hostname:5678`

6. Set up the credentials:
   - IMAP Account: For email processing
   - SMTP Account: For sending emails
   - S3 Account: For file storage
   - API Key: For HVAC CRM API access

## Workflow Configuration

### Email Processing Workflow

The email processing workflow automatically processes incoming emails and creates service orders or warranty requests based on the email content.

Configuration steps:

1. Open the n8n editor
2. Navigate to the "Email Processor" workflow
3. Configure the IMAP node with your email credentials
4. Configure the HTTP Request nodes with your API URL and key
5. Configure the Email Send node with your SMTP credentials
6. Save and activate the workflow

### Appointment Reminder Workflow

The appointment reminder workflow automatically sends reminders to clients before their service appointments.

Configuration steps:

1. Open the n8n editor
2. Navigate to the "Appointment Reminder" workflow
3. Configure the HTTP Request nodes with your API URL and key
4. Configure the Email Send node with your SMTP credentials
5. Save and activate the workflow

## API Integration

The n8n integration communicates with the HVAC CRM system through the API. The following endpoints are used:

- `/api/clients`: Client management
- `/api/service-orders`: Service order management
- `/api/appointments`: Appointment management
- `/api/warranties`: Warranty management
- `/api/inventory`: Inventory management
- `/api/reports`: Report management

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check that the HVAC CRM API is accessible from the n8n server
2. **Authentication Failed**: Verify the API key is correct
3. **Email Connection Failed**: Check the SMTP/IMAP credentials and server settings
4. **Workflow Execution Failed**: Check the execution logs in the n8n editor

### Logs

To view the logs of the n8n integration:

```bash
./deploy.sh --logs
```

## Maintenance

### Updating n8n

To update the n8n integration:

1. Stop the n8n integration:
   ```bash
   ./deploy.sh --stop
   ```

2. Update the docker-compose.yml file with the new n8n version

3. Start the n8n integration:
   ```bash
   ./deploy.sh --start
   ```

### Backup and Restore

To backup the n8n data:

```bash
docker-compose exec postgres pg_dump -U n8n n8n > n8n_backup.sql
```

To restore the n8n data:

```bash
cat n8n_backup.sql | docker-compose exec -T postgres psql -U n8n n8n
```

## Support

For support with the n8n integration, please contact:

- Email: support@markotronix.com
- Phone: +1-800-HVAC-CRM

## License

This project is proprietary and confidential.