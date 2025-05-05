# E-Signature Integration Tools

This directory contains tools to help you test and configure the e-signature integration for the link service.

## E-Signature Integration Tester

The `test_esign.py` script helps you test your DocuSign or HelloSign integration by creating a test document and sending it for signature.

### Prerequisites

- Python 3.7 or higher
- Required Python packages:
  - python-dotenv
  - requests
  - requests-toolbelt
  - fpdf

### Installation

```bash
pip install python-dotenv requests requests-toolbelt fpdf
```

### Usage

#### Testing DocuSign Integration

```bash
python test_esign.py --provider=docusign --api-key=YOUR_DOCUSIGN_API_KEY --email=recipient@example.com
```

#### Testing HelloSign Integration

```bash
python test_esign.py --provider=hellosign --api-key=YOUR_HELLOSIGN_API_KEY --email=recipient@example.com
```

### Environment Variables

Instead of passing the API key and recipient email as command-line arguments, you can set them in your `.env` file:

```
# DocuSign
DOCUSIGN_API_KEY=your-docusign-api-key
DOCUSIGN_ACCOUNT_ID=your-docusign-account-id
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi/v2.1

# HelloSign
HELLOSIGN_API_KEY=your-hellosign-api-key

# Test recipient
TEST_EMAIL=recipient@example.com
TEST_NAME=Test User
```

## Setting Up DocuSign Integration

1. Create a DocuSign developer account at [https://developers.docusign.com/](https://developers.docusign.com/)
2. Create a new application in the DocuSign developer dashboard
3. Generate an API key for your application
4. Find your account ID in the DocuSign dashboard
5. Add the API key and account ID to your `.env` file

## Setting Up HelloSign Integration

1. Create a HelloSign account at [https://www.hellosign.com/](https://www.hellosign.com/)
2. Generate an API key in the HelloSign dashboard
3. Add the API key to your `.env` file

## Troubleshooting

### DocuSign

- Make sure your DocuSign account is active
- Verify that your API key has the correct permissions
- Check that your account ID is correct
- If using a production account, change the base URL to `https://www.docusign.net/restapi/v2.1`

### HelloSign

- Make sure your HelloSign account is active
- Verify that your API key is correct
- If you're on a free plan, there may be limitations on API usage