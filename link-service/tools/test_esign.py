#!/usr/bin/env python3
"""
E-Signature Integration Tester

This script helps users test their DocuSign or HelloSign integration by creating a test
document and sending it for signature.

Usage:
  python test_esign.py --provider=docusign --api-key=YOUR_API_KEY
  python test_esign.py --provider=hellosign --api-key=YOUR_API_KEY
"""

import os
import sys
import argparse
import json
import requests
import tempfile
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Parse command line arguments
parser = argparse.ArgumentParser(description='E-Signature Integration Tester')
parser.add_argument('--provider', required=True, choices=['docusign', 'hellosign'], help='E-signature provider (docusign or hellosign)')
parser.add_argument('--api-key', help='API key for the provider')
parser.add_argument('--email', help='Email address to send the test document to')
parser.add_argument('--name', help='Name of the recipient')
args = parser.parse_args()

def create_test_pdf():
    """Create a simple test PDF document."""
    try:
        import fpdf
        
        # Create a PDF with FPDF
        pdf = fpdf.FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        # Add content to the PDF
        pdf.cell(200, 10, txt="HVAC CRM - Test Document", ln=True, align='C')
        pdf.cell(200, 10, txt="", ln=True)
        pdf.cell(200, 10, txt="This is a test document for e-signature integration.", ln=True)
        pdf.cell(200, 10, txt="", ln=True)
        pdf.cell(200, 10, txt="Please sign below:", ln=True)
        pdf.cell(200, 10, txt="", ln=True)
        pdf.cell(200, 10, txt="_______________________________", ln=True)
        pdf.cell(200, 10, txt="Signature", ln=True)
        
        # Save the PDF to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
            temp_path = temp.name
        
        pdf.output(temp_path)
        print(f"Created test PDF: {temp_path}")
        return temp_path
    
    except ImportError:
        print("Error: fpdf package is not installed. Please install it with 'pip install fpdf'.")
        return None

def test_docusign(api_key, email, name):
    """Test DocuSign integration."""
    # Use provided API key or get from environment
    api_key = api_key or os.getenv('DOCUSIGN_API_KEY')
    if not api_key:
        print("Error: DocuSign API key not provided and not found in environment.")
        return False
    
    # Use provided email or get from environment
    email = email or os.getenv('TEST_EMAIL')
    if not email:
        print("Error: Recipient email not provided and not found in environment.")
        return False
    
    # Use provided name or default
    name = name or os.getenv('TEST_NAME', 'Test User')
    
    # Create a test PDF
    pdf_path = create_test_pdf()
    if not pdf_path:
        return False
    
    # DocuSign API base URL
    base_url = os.getenv('DOCUSIGN_BASE_URL', 'https://demo.docusign.net/restapi/v2.1')
    account_id = os.getenv('DOCUSIGN_ACCOUNT_ID')
    
    if not account_id:
        print("Error: DocuSign account ID not found in environment.")
        print("Please set DOCUSIGN_ACCOUNT_ID in your .env file.")
        os.unlink(pdf_path)
        return False
    
    # Set up the API request
    url = f"{base_url}/accounts/{account_id}/envelopes"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    # Read the PDF file
    with open(pdf_path, "rb") as file:
        pdf_bytes = file.read()
    
    # Base64 encode the PDF
    import base64
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    # Create the envelope definition
    data = {
        "emailSubject": "HVAC CRM - Test Document for Signature",
        "documents": [
            {
                "documentBase64": pdf_base64,
                "name": "Test Document.pdf",
                "fileExtension": "pdf",
                "documentId": "1"
            }
        ],
        "recipients": {
            "signers": [
                {
                    "email": email,
                    "name": name,
                    "recipientId": "1",
                    "tabs": {
                        "signHereTabs": [
                            {
                                "documentId": "1",
                                "pageNumber": "1",
                                "xPosition": "200",
                                "yPosition": "400"
                            }
                        ]
                    }
                }
            ]
        },
        "status": "sent"
    }
    
    # Make the API request
    print(f"Testing DocuSign API...")
    print(f"Sending test document to {email}...")
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        
        # Clean up
        os.unlink(pdf_path)
        
        # Print the response
        print("\nResponse from DocuSign API:")
        print("-" * 50)
        print(f"Envelope ID: {result.get('envelopeId')}")
        print(f"Status: {result.get('status')}")
        print("-" * 50)
        
        print("\nDocuSign integration test successful!")
        print(f"A test document has been sent to {email} for signature.")
        return True
    
    except Exception as e:
        # Clean up
        os.unlink(pdf_path)
        
        print(f"\nError testing DocuSign API: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print(f"Response status code: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return False

def test_hellosign(api_key, email, name):
    """Test HelloSign integration."""
    # Use provided API key or get from environment
    api_key = api_key or os.getenv('HELLOSIGN_API_KEY')
    if not api_key:
        print("Error: HelloSign API key not provided and not found in environment.")
        return False
    
    # Use provided email or get from environment
    email = email or os.getenv('TEST_EMAIL')
    if not email:
        print("Error: Recipient email not provided and not found in environment.")
        return False
    
    # Use provided name or default
    name = name or os.getenv('TEST_NAME', 'Test User')
    
    # Create a test PDF
    pdf_path = create_test_pdf()
    if not pdf_path:
        return False
    
    # HelloSign API base URL
    url = "https://api.hellosign.com/v3/signature_request/send"
    
    # Set up the API request
    headers = {
        "Authorization": f"Basic {api_key}"
    }
    
    # Create the multipart form data
    import requests_toolbelt
    from requests_toolbelt.multipart.encoder import MultipartEncoder
    
    multipart_data = MultipartEncoder(
        fields={
            'title': 'HVAC CRM - Test Document',
            'subject': 'HVAC CRM - Test Document for Signature',
            'message': 'Please sign this test document.',
            'signers[0][email_address]': email,
            'signers[0][name]': name,
            'file[0]': ('test_document.pdf', open(pdf_path, 'rb'), 'application/pdf')
        }
    )
    
    headers['Content-Type'] = multipart_data.content_type
    
    # Make the API request
    print(f"Testing HelloSign API...")
    print(f"Sending test document to {email}...")
    try:
        response = requests.post(url, headers=headers, data=multipart_data)
        response.raise_for_status()
        result = response.json()
        
        # Clean up
        os.unlink(pdf_path)
        
        # Print the response
        print("\nResponse from HelloSign API:")
        print("-" * 50)
        print(f"Signature Request ID: {result.get('signature_request', {}).get('signature_request_id')}")
        print(f"Status: {result.get('signature_request', {}).get('is_complete')}")
        print("-" * 50)
        
        print("\nHelloSign integration test successful!")
        print(f"A test document has been sent to {email} for signature.")
        return True
    
    except Exception as e:
        # Clean up
        os.unlink(pdf_path)
        
        print(f"\nError testing HelloSign API: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print(f"Response status code: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return False

if __name__ == "__main__":
    print("E-Signature Integration Tester")
    print("=============================")
    
    # Check for required packages
    try:
        import fpdf
    except ImportError:
        print("Error: fpdf package is not installed.")
        print("Please install it with: pip install fpdf")
        sys.exit(1)
    
    try:
        import requests_toolbelt
    except ImportError:
        print("Error: requests_toolbelt package is not installed.")
        print("Please install it with: pip install requests-toolbelt")
        sys.exit(1)
    
    # Get email and name from arguments or environment
    email = args.email or os.getenv('TEST_EMAIL')
    name = args.name or os.getenv('TEST_NAME', 'Test User')
    
    # Prompt for email if not provided
    if not email:
        email = input("Enter recipient email address: ")
    
    if args.provider == 'docusign':
        success = test_docusign(args.api_key, email, name)
    elif args.provider == 'hellosign':
        success = test_hellosign(args.api_key, email, name)
    
    sys.exit(0 if success else 1)