#!/usr/bin/env python3
"""
Email Integration Tester

This script helps users test their email integration by connecting to the configured
IMAP server and listing recent emails.

Usage:
  python test_email.py
  python test_email.py --server=imap.example.com --port=993 --username=user@example.com --password=password
"""

import os
import sys
import argparse
import imaplib
import email
from email.header import decode_header
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Parse command line arguments
parser = argparse.ArgumentParser(description='Email Integration Tester')
parser.add_argument('--server', help='IMAP server address')
parser.add_argument('--port', type=int, help='IMAP server port')
parser.add_argument('--username', help='Email username')
parser.add_argument('--password', help='Email password')
parser.add_argument('--use-tls', action='store_true', help='Use TLS')
parser.add_argument('--limit', type=int, default=5, help='Number of emails to list')
args = parser.parse_args()

def decode_str(s):
    """Decode email subject or sender."""
    if s is None:
        return ""
    decoded_parts = decode_header(s)
    result = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try:
                result += part.decode(encoding or 'utf-8', errors='replace')
            except:
                result += part.decode('utf-8', errors='replace')
        else:
            result += part
    return result

def test_email_connection():
    """Test email connection and list recent emails."""
    # Use provided credentials or get from environment
    server = args.server or os.getenv('MAIL_SERVER')
    port = args.port or int(os.getenv('MAIL_PORT', 993))
    username = args.username or os.getenv('MAIL_USERNAME')
    password = args.password or os.getenv('MAIL_PASSWORD')
    use_tls = args.use_tls or os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    
    if not all([server, port, username, password]):
        print("Error: Email credentials not provided and not found in environment.")
        print("Please provide credentials as command-line arguments or set them in the .env file.")
        return False
    
    try:
        # Connect to the IMAP server
        print(f"Connecting to {server}:{port} as {username}...")
        
        if use_tls:
            mail = imaplib.IMAP4_SSL(server, port)
        else:
            mail = imaplib.IMAP4(server, port)
        
        # Login to the account
        mail.login(username, password)
        print("Login successful!")
        
        # List available mailboxes
        status, mailboxes = mail.list()
        print("\nAvailable mailboxes:")
        for mailbox in mailboxes:
            print(f"  - {mailbox.decode()}")
        
        # Select the inbox
        print("\nSelecting INBOX...")
        status, messages = mail.select("INBOX")
        
        if status != 'OK':
            print(f"Error selecting INBOX: {messages[0].decode()}")
            mail.logout()
            return False
        
        # Get the number of emails in the inbox
        messages = int(messages[0])
        print(f"Found {messages} emails in INBOX")
        
        # Fetch the latest emails
        limit = min(args.limit, messages)
        print(f"\nFetching the {limit} most recent emails:")
        
        for i in range(messages, messages - limit, -1):
            if i <= 0:
                break
                
            # Fetch the email
            status, msg_data = mail.fetch(str(i), "(RFC822)")
            
            if status != 'OK':
                print(f"Error fetching email {i}: {msg_data[0].decode()}")
                continue
            
            # Parse the email
            msg = email.message_from_bytes(msg_data[0][1])
            
            # Get email details
            subject = decode_str(msg["Subject"])
            from_addr = decode_str(msg["From"])
            date = decode_str(msg["Date"])
            
            # Print email details
            print(f"\nEmail {i}:")
            print(f"  From: {from_addr}")
            print(f"  Date: {date}")
            print(f"  Subject: {subject}")
            
            # Check for attachments
            attachments = []
            for part in msg.walk():
                if part.get_content_maintype() == 'multipart':
                    continue
                if part.get('Content-Disposition') is None:
                    continue
                
                filename = part.get_filename()
                if filename:
                    attachments.append(decode_str(filename))
            
            if attachments:
                print(f"  Attachments: {', '.join(attachments)}")
            else:
                print("  No attachments")
        
        # Logout
        mail.logout()
        print("\nEmail connection test successful!")
        return True
    
    except Exception as e:
        print(f"\nError testing email connection: {str(e)}")
        return False

if __name__ == "__main__":
    print("Email Integration Tester")
    print("=======================")
    
    success = test_email_connection()
    sys.exit(0 if success else 1)