# Attachment Processors

This package provides a comprehensive system for processing email attachments in the MarkoTronix HVAC CRM/ERP system. It includes specialized processors for different types of attachments, allowing for automatic extraction of text, metadata, and entities from various file formats.

## Features

- **Modular Architecture**: Each file type has its own specialized processor
- **OCR Capabilities**: Extract text from images and scanned PDFs
- **Entity Extraction**: Automatically identify and extract key information like invoice numbers, amounts, dates, and contact details
- **Document Classification**: Automatically tag documents based on their content
- **Metadata Extraction**: Extract and store metadata from documents
- **Extensible Design**: Easy to add new processors for additional file types

## Supported File Types

| File Type | Processor | Features |
|-----------|-----------|----------|
| PDF | `PDFProcessor` | Text extraction, OCR for scanned documents, metadata extraction, entity recognition |
| Images (JPG, PNG, etc.) | `ImageProcessor` | OCR, EXIF metadata extraction, entity recognition |
| Excel (XLSX, XLS, CSV) | `ExcelProcessor` | Data extraction, header analysis, entity recognition |
| Word (DOCX, DOC) | `WordProcessor` | Text extraction, metadata extraction, entity recognition |

## Usage

The attachment processing system is designed to be used through the `AttachmentHandler` class, which provides a high-level interface for processing attachments:

```python
from app.attachment_handler import AttachmentHandler
from pathlib import Path

# Initialize the handler
handler = AttachmentHandler(
    attachments_dir=Path("/app/attachments"),
    supabase_client=supabase_client  # Optional
)

# Process an attachment
result = await handler.process_attachment(
    file_path="/path/to/attachment.pdf",
    content_type="application/pdf",
    email_id=123
)

# Process all attachments for an email
results = await handler.process_email_attachments(
    email_id=123,
    attachments=[
        {"file_path": "/path/to/attachment1.pdf", "content_type": "application/pdf"},
        {"file_path": "/path/to/attachment2.jpg", "content_type": "image/jpeg"}
    ]
)
```

## Processing Results

Each processor returns a standardized `AttachmentProcessingResult` object with the following fields:

- `success`: Whether processing was successful
- `error_message`: Error message if processing failed
- `text_content`: Extracted text content
- `metadata`: Extracted metadata
- `entities`: Extracted entities (key-value pairs)
- `tags`: Categorization tags
- `confidence`: Confidence score for extraction (0.0 to 1.0)
- `processed_file_path`: Path to processed file (if saved separately)

## Dependencies

The attachment processors require several external libraries:

- `pytesseract` and `pdf2image` for OCR
- `PyPDF2` for PDF processing
- `Pillow` for image processing
- `pandas` and `openpyxl` for Excel processing
- `python-docx` for Word document processing

These dependencies are optional and will be checked at runtime. If a dependency is missing, the corresponding processor will be disabled.

## Extending the System

To add a new processor for a different file type:

1. Create a new processor class that inherits from `AttachmentProcessor`
2. Implement the required methods: `process()`, `can_process()`, and `get_mime_types()`
3. Register the processor in the `AVAILABLE_PROCESSORS` list in `factory.py`

## Future Improvements

- Add more specialized processors for domain-specific documents
- Integrate with ML models for improved entity extraction
- Add support for more languages in OCR
- Implement validation for extracted data
- Add feedback loop for improving extraction accuracy