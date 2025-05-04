# Email Integration Tools

This directory contains tools to help you test and configure the email integration for the mail ingest service.

## Email Integration Tester

The `test_email.py` script helps you test your email integration by connecting to the configured IMAP server and listing recent emails.

### Prerequisites

- Python 3.7 or higher
- Required Python packages:
  - python-dotenv

### Installation

```bash
pip install python-dotenv
```

### Usage

#### Using Environment Variables

If you have already configured your email settings in the `.env` file, you can simply run:

```bash
python test_email.py
```

#### Using Command-Line Arguments

You can also provide the email settings as command-line arguments:

```bash
python test_email.py --server=imap.example.com --port=993 --username=user@example.com --password=password --use-tls
```

#### Additional Options

- `--limit=10`: Specify the number of emails to list (default: 5)

### Environment Variables

The script uses the following environment variables from your `.env` file:

```
MAIL_SERVER=imap.example.com
MAIL_PORT=993
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_USE_TLS=true
```

## Troubleshooting

### Common IMAP Server Settings

#### Gmail
- Server: imap.gmail.com
- Port: 993
- TLS: Yes
- Note: You may need to enable "Less secure app access" or use an app password

#### Outlook/Office 365
- Server: outlook.office365.com
- Port: 993
- TLS: Yes

#### Yahoo Mail
- Server: imap.mail.yahoo.com
- Port: 993
- TLS: Yes

### Connection Issues

- Verify your server address and port
- Check that your username and password are correct
- Ensure that IMAP access is enabled for your email account
- Check if your email provider requires additional security settings
- If using Gmail, you may need to create an app password