# PDF Generation Tools

This directory contains tools to help you test and configure the PDF generation functionality for the offer generation service.

## PDF Generation Tester

The `test_pdf.py` script helps you test the PDF generation functionality by creating a sample offer document with test data.

### Prerequisites

- Python 3.7 or higher
- Required Python packages:
  - python-dotenv
  - fpdf

### Installation

```bash
pip install python-dotenv fpdf
```

### Usage

#### Basic Usage

```bash
python test_pdf.py
```

This will create a file named `test_offer.pdf` in the current directory.

#### Custom Output Path

```bash
python test_pdf.py --output=/path/to/output.pdf
```

#### Custom Company Information

```bash
python test_pdf.py --company-name="Your HVAC Company" --company-logo=/path/to/logo.png
```

### Environment Variables

You can set the following environment variables in your `.env` file:

```
COMPANY_NAME=Your HVAC Company
```

## Customizing the PDF Template

The PDF generation script uses FPDF to create the PDF document. You can customize the template by modifying the `test_pdf.py` script.

### Adding a Logo

To add a company logo to the PDF, provide the path to the logo image:

```bash
python test_pdf.py --company-logo=/path/to/logo.png
```

The logo should be in a format supported by FPDF (PNG, JPEG, or GIF).

### Customizing Colors

You can modify the colors used in the PDF by changing the RGB values in the `set_fill_color` method calls.

### Customizing Fonts

FPDF supports the following font families by default:
- Arial
- Courier
- Times
- Symbol
- ZapfDingbats

To use custom fonts, you'll need to add them to the FPDF instance using the `add_font` method.