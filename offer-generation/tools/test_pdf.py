#!/usr/bin/env python3
"""
PDF Generation Tester

This script helps users test the PDF generation functionality by creating a sample offer
document with test data.

Usage:
  python test_pdf.py
  python test_pdf.py --output=test_offer.pdf
"""

import os
import sys
import argparse
import json
import tempfile
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Parse command line arguments
parser = argparse.ArgumentParser(description='PDF Generation Tester')
parser.add_argument('--output', help='Output PDF file path')
parser.add_argument('--company-name', help='Company name to use in the offer')
parser.add_argument('--company-logo', help='Path to company logo image')
args = parser.parse_args()

def create_test_pdf():
    """Create a sample offer PDF document."""
    try:
        import fpdf
        from fpdf import FPDF
        
        # Use provided company name or default
        company_name = args.company_name or os.getenv('COMPANY_NAME', 'HVAC Solutions Inc.')
        
        # Use provided output path or default
        output_path = args.output or 'test_offer.pdf'
        
        # Sample customer data
        customer = {
            'name': 'John Smith',
            'email': 'john.smith@example.com',
            'phone': '(555) 123-4567',
            'address': '123 Main St, Anytown, USA 12345'
        }
        
        # Sample offer data
        offer = {
            'id': 'OFF-2025-001',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'valid_until': '2025-06-03',
            'items': [
                {
                    'description': 'Air Conditioning Unit Installation',
                    'quantity': 1,
                    'unit_price': 2500.00,
                    'total': 2500.00
                },
                {
                    'description': 'Ductwork Modification',
                    'quantity': 1,
                    'unit_price': 800.00,
                    'total': 800.00
                },
                {
                    'description': 'Smart Thermostat',
                    'quantity': 1,
                    'unit_price': 250.00,
                    'total': 250.00
                },
                {
                    'description': 'Labor (hours)',
                    'quantity': 8,
                    'unit_price': 75.00,
                    'total': 600.00
                }
            ],
            'subtotal': 4150.00,
            'tax_rate': 0.08,
            'tax': 332.00,
            'total': 4482.00
        }
        
        # Create PDF
        class PDF(FPDF):
            def header(self):
                # Logo
                logo_path = args.company_logo
                if logo_path and os.path.exists(logo_path):
                    self.image(logo_path, 10, 8, 33)
                
                # Company name
                self.set_font('Arial', 'B', 20)
                self.cell(0, 10, company_name, 0, 1, 'R')
                
                # Line break
                self.ln(20)
            
            def footer(self):
                # Position at 1.5 cm from bottom
                self.set_y(-15)
                # Arial italic 8
                self.set_font('Arial', 'I', 8)
                # Page number
                self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')
        
        # Initialize PDF
        pdf = PDF()
        pdf.alias_nb_pages()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Title
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'HVAC Service Offer', 0, 1, 'C')
        pdf.ln(5)
        
        # Offer details
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f"Offer #: {offer['id']}", 0, 1)
        pdf.cell(0, 10, f"Date: {offer['date']}", 0, 1)
        pdf.cell(0, 10, f"Valid Until: {offer['valid_until']}", 0, 1)
        pdf.ln(5)
        
        # Customer details
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, 'Customer Information:', 0, 1)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 10, f"Name: {customer['name']}", 0, 1)
        pdf.cell(0, 10, f"Email: {customer['email']}", 0, 1)
        pdf.cell(0, 10, f"Phone: {customer['phone']}", 0, 1)
        pdf.cell(0, 10, f"Address: {customer['address']}", 0, 1)
        pdf.ln(10)
        
        # Items table
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, 'Services & Products:', 0, 1)
        
        # Table header
        pdf.set_fill_color(200, 220, 255)
        pdf.cell(100, 10, 'Description', 1, 0, 'C', 1)
        pdf.cell(20, 10, 'Qty', 1, 0, 'C', 1)
        pdf.cell(30, 10, 'Unit Price', 1, 0, 'C', 1)
        pdf.cell(40, 10, 'Total', 1, 1, 'C', 1)
        
        # Table data
        pdf.set_font('Arial', '', 12)
        for item in offer['items']:
            pdf.cell(100, 10, item['description'], 1, 0)
            pdf.cell(20, 10, str(item['quantity']), 1, 0, 'C')
            pdf.cell(30, 10, f"${item['unit_price']:.2f}", 1, 0, 'R')
            pdf.cell(40, 10, f"${item['total']:.2f}", 1, 1, 'R')
        
        # Totals
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(150, 10, 'Subtotal:', 0, 0, 'R')
        pdf.cell(40, 10, f"${offer['subtotal']:.2f}", 1, 1, 'R')
        
        pdf.cell(150, 10, f"Tax ({offer['tax_rate']*100:.0f}%):", 0, 0, 'R')
        pdf.cell(40, 10, f"${offer['tax']:.2f}", 1, 1, 'R')
        
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(150, 10, 'Total:', 0, 0, 'R')
        pdf.cell(40, 10, f"${offer['total']:.2f}", 1, 1, 'R')
        
        # Terms and conditions
        pdf.ln(10)
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, 'Terms and Conditions:', 0, 1)
        pdf.set_font('Arial', '', 10)
        pdf.multi_cell(0, 10, """
1. This offer is valid until the date specified above.
2. Payment terms: 50% deposit, 50% upon completion.
3. Warranty: All work is guaranteed for 1 year from completion.
4. Cancellation: 48 hours notice required for cancellation without penalty.
5. Additional work not specified in this offer will be quoted separately.
        """)
        
        # Signature
        pdf.ln(10)
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, 'Acceptance:', 0, 1)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 10, 'I accept the terms and conditions of this offer:', 0, 1)
        pdf.ln(10)
        pdf.cell(80, 10, 'Signature: _________________________', 0, 0)
        pdf.cell(80, 10, 'Date: _________________', 0, 1)
        pdf.ln(5)
        pdf.cell(0, 10, f"Print Name: {customer['name']}", 0, 1)
        
        # Output the PDF
        pdf.output(output_path)
        print(f"PDF generated successfully: {output_path}")
        return output_path
    
    except ImportError:
        print("Error: fpdf package is not installed. Please install it with 'pip install fpdf'.")
        return None

if __name__ == "__main__":
    print("PDF Generation Tester")
    print("====================")
    
    # Check for required packages
    try:
        import fpdf
    except ImportError:
        print("Error: fpdf package is not installed.")
        print("Please install it with: pip install fpdf")
        sys.exit(1)
    
    # Create the PDF
    pdf_path = create_test_pdf()
    
    if pdf_path:
        print("\nPDF generation test successful!")
        print(f"PDF saved to: {pdf_path}")
        sys.exit(0)
    else:
        print("\nPDF generation test failed.")
        sys.exit(1)