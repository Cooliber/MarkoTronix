# Mail Ingest Service

This service is responsible for ingesting emails from IMAP servers or webhooks, processing attachments, and extracting data from them using OCR and other techniques.

## Features

- **Email Ingestion**: Fetch emails from IMAP servers or receive them via webhooks
- **Attachment Processing**: Process attachments with specialized processors for different file types
- **OCR**: Extract text from images and scanned PDFs
- **Entity Extraction**: Automatically identify and extract key information like invoice numbers, amounts, dates, and contact details
- **Document Classification**: Automatically tag documents based on their content
- **Metadata Extraction**: Extract and store metadata from documents
- **Storage**: Store emails, attachments, and processed data in a database and Supabase storage
- **API**: RESTful API for accessing and searching emails and attachments

## Supported File Types

| File Type | Processor | Features |
|-----------|-----------|----------|
| PDF | `PDFProcessor` | Text extraction, OCR for scanned documents, metadata extraction, entity recognition |
| Images (JPG, PNG, etc.) | `ImageProcessor` | OCR, EXIF metadata extraction, entity recognition |
| Excel (XLSX, XLS, CSV) | `ExcelProcessor` | Data extraction, header analysis, entity recognition |
| Word (DOCX, DOC) | `WordProcessor` | Text extraction, metadata extraction, entity recognition |

## API Endpoints

### Email Endpoints

- `GET /emails`: Get all emails
- `GET /emails/{email_id}`: Get a specific email
- `GET /emails/{email_id}/attachments`: Get all attachments for a specific email
- `GET /emails/{email_id}/attachments/processed`: Get all attachments with processed data for a specific email
- `POST /emails/{email_id}/reprocess`: Requeue an email for processing

### Attachment Endpoints

- `GET /attachments/{attachment_id}/processed`: Get processed data for a specific attachment
- `POST /attachments/{attachment_id}/reprocess`: Reprocess an attachment
- `GET /attachments/search`: Search attachments by content, tags, and entities
- `GET /attachments/stats`: Get statistics about processed attachments

### Webhook Endpoints

- `POST /webhook/email`: Receive an email via webhook

### Utility Endpoints

- `GET /export/{table}`: Export data from a specific table
- `POST /import/{table}`: Import data to a specific table
- `POST /manual/fetch`: Manually trigger email fetching

## Configuration

The service can be configured using environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `MAIL_SERVER`: IMAP server address
- `MAIL_PORT`: IMAP server port
- `MAIL_USERNAME`: IMAP username
- `MAIL_PASSWORD`: IMAP password
- `MAIL_USE_TLS`: Whether to use TLS for IMAP connection
- `MAIL_CHECK_INTERVAL`: Interval in seconds for checking new emails
- `SUPABASE_URL`: Supabase URL
- `SUPABASE_KEY`: Supabase API key

## Dependencies

The service requires several external libraries:

- `fastapi` and `uvicorn` for the API server
- `sqlalchemy` for database access
- `imap-tools` for IMAP connection
- `redis` for message queue
- `supabase` for storage
- `pytesseract` and `pdf2image` for OCR
- `PyPDF2` for PDF processing
- `Pillow` for image processing
- `pandas` and `openpyxl` for Excel processing
- `python-docx` for Word document processing

## Usage

### Running the Service

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker

```bash
# Build the Docker image
docker build -t mail-ingest-service .

# Run the Docker container
docker run -p 8000:8000 --env-file .env mail-ingest-service
```

## Development

### Adding a New Processor

To add a new processor for a different file type:

1. Create a new processor class that inherits from `AttachmentProcessor`
2. Implement the required methods: `process()`, `can_process()`, and `get_mime_types()`
3. Register the processor in the `AVAILABLE_PROCESSORS` list in `factory.py`

### Testing

```bash
# Run tests
pytest
```

## Future Improvements

- Add more specialized processors for domain-specific documents
- Integrate with ML models for improved entity extraction
- Add support for more languages in OCR
- Implement validation for extracted data
- Add feedback loop for improving extraction accuracy