import os
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, BackgroundTasks, Depends, File, UploadFile, Form, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from imap_tools import MailBox, AND
import redis
import json
import uuid
import shutil
from pathlib import Path
from supabase import create_client, Client
import prometheus_client

# Import models and schemas
from app.models import Base, Email, Attachment, ProcessedAttachment
from app.schemas import (
    EmailBase, EmailCreate, EmailResponse,
    AttachmentBase, AttachmentCreate, AttachmentResponse,
    ProcessedAttachmentBase, ProcessedAttachmentCreate, ProcessedAttachmentResponse,
    EmailWithAttachments, AttachmentWithProcessedData, EmailWithProcessedAttachments
)

# Import core modules
from app.core.logging import get_logger, setup_logging, setup_middleware
from app.core.exceptions import (
    setup_exception_handlers,
    ServiceException,
    NotFoundException,
    ValidationException,
    DatabaseException,
    ExternalServiceException,
    EmailFetchException,
    EmailParseException,
    AttachmentProcessingException,
)
from app.core.circuit_breaker import (
    create_circuit_breaker,
    circuit_breaker,
    get_all_circuit_breakers,
)
from app.core.health import health_router

# Import attachment handler
from app.attachment_handler import AttachmentHandler

# Initialize logger
logger = get_logger(__name__)

# Load environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/hvac_crm")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_PORT = int(os.getenv("MAIL_PORT", "993"))
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
MAIL_CHECK_INTERVAL = int(os.getenv("MAIL_CHECK_INTERVAL", "60"))
ATTACHMENTS_DIR = Path("/app/attachments")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Ensure attachments directory exists
ATTACHMENTS_DIR.mkdir(exist_ok=True, parents=True)

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis setup
redis_client = redis.from_url(REDIS_URL)

# Prometheus metrics
EMAIL_FETCH_COUNTER = prometheus_client.Counter(
    "mail_ingest_emails_fetched_total",
    "Total number of emails fetched",
)

EMAIL_PROCESS_COUNTER = prometheus_client.Counter(
    "mail_ingest_emails_processed_total",
    "Total number of emails processed",
)

ATTACHMENT_COUNTER = prometheus_client.Counter(
    "mail_ingest_attachments_processed_total",
    "Total number of attachments processed",
)

ATTACHMENT_PROCESS_COUNTER = prometheus_client.Counter(
    "mail_ingest_attachments_processed_with_ocr_total",
    "Total number of attachments processed with OCR and data extraction",
)

EMAIL_FETCH_DURATION = prometheus_client.Histogram(
    "mail_ingest_email_fetch_duration_seconds",
    "Time spent fetching emails",
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
)

ATTACHMENT_UPLOAD_DURATION = prometheus_client.Histogram(
    "mail_ingest_attachment_upload_duration_seconds",
    "Time spent uploading attachments",
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
)

ATTACHMENT_PROCESS_DURATION = prometheus_client.Histogram(
    "mail_ingest_attachment_process_duration_seconds",
    "Time spent processing attachments with OCR and data extraction",
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0),
)

# Create tables if they don't exist
from sqlalchemy import inspect
inspector = inspect(engine)
if not inspector.has_table("emails") or not inspector.has_table("attachments") or not inspector.has_table("processed_attachments"):
    Base.metadata.create_all(bind=engine)
else:
    logger.info("Tables already exist, skipping creation")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create circuit breakers
supabase_cb = create_circuit_breaker(
    name="supabase",
    failure_threshold=3,
    recovery_timeout=60.0,
)

imap_cb = create_circuit_breaker(
    name="imap",
    failure_threshold=3,
    recovery_timeout=120.0,
)

# Initialize attachment handler
attachment_handler = AttachmentHandler(
    attachments_dir=ATTACHMENTS_DIR,
    supabase_client=supabase
)

# Background tasks
@circuit_breaker(
    name="imap",
    failure_threshold=3,
    recovery_timeout=120.0,
    expected_exceptions={Exception},
)
async def fetch_emails():
    """Fetch emails from the mail server and store them in the database."""
    if not all([MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD]):
        logger.warning("Mail server credentials not configured. Skipping email fetch.")
        return

    logger.info(f"Connecting to mail server {MAIL_SERVER}:{MAIL_PORT}")

    try:
        with EMAIL_FETCH_DURATION.time():
            with MailBox(MAIL_SERVER, MAIL_PORT).login(MAIL_USERNAME, MAIL_PASSWORD, initial_folder='INBOX') as mailbox:
                for msg in mailbox.fetch(AND(seen=False)):
                    # Check if email already exists
                    db = SessionLocal()
                    existing_email = db.query(Email).filter(Email.message_id == msg.uid).first()

                    if existing_email:
                        logger.info(f"Email {msg.uid} already exists. Skipping.")
                        continue

                    # Create new email record
                    email = Email(
                        message_id=msg.uid,
                        from_email=msg.from_,
                        to_email=", ".join(msg.to),
                        subject=msg.subject,
                        body=msg.html or msg.text,
                        received_date=msg.date,
                    )
                    db.add(email)
                    db.commit()
                    db.refresh(email)

                    # Increment email counter
                    EMAIL_FETCH_COUNTER.inc()

                    # Save and process attachments
                    for att in msg.attachments:
                        # Save attachment to disk
                        file_path = await attachment_handler.save_attachment(
                            email_id=email.id,
                            filename=att.filename,
                            content=att.payload
                        )

                        # Create attachment record
                        attachment = Attachment(
                            email_id=email.id,
                            filename=att.filename,
                            content_type=att.content_type,
                            file_path=file_path,
                        )
                        db.add(attachment)
                        db.commit()
                        db.refresh(attachment)

                        # Increment attachment counter
                        ATTACHMENT_COUNTER.inc()

                        # Process attachment with OCR and data extraction
                        with ATTACHMENT_PROCESS_DURATION.time():
                            processing_result = await attachment_handler.process_attachment(
                                file_path=file_path,
                                content_type=att.content_type,
                                email_id=email.id
                            )

                        # Store processing results
                        processed_attachment = ProcessedAttachment(
                            attachment_id=attachment.id,
                            success=processing_result.get('success', False),
                            text_content=processing_result.get('text_content'),
                            metadata=processing_result.get('metadata'),
                            entities=processing_result.get('entities'),
                            tags=processing_result.get('tags'),
                            confidence=processing_result.get('confidence', 0.0),
                            error_message=processing_result.get('error_message'),
                            supabase_path=processing_result.get('supabase_path'),
                            public_url=processing_result.get('public_url')
                        )
                        db.add(processed_attachment)

                        # Increment processed attachment counter
                        ATTACHMENT_PROCESS_COUNTER.inc()

                    db.commit()

                    # Queue email for processing
                    redis_client.lpush("process_email", json.dumps({"email_id": email.id}))
                    logger.info(f"Email {email.id} queued for processing")

                    db.close()
    except Exception as e:
        logger.error(f"Error fetching emails: {str(e)}")
        raise EmailFetchException(f"Failed to fetch emails: {str(e)}")

async def email_fetcher():
    """Background task to periodically fetch emails."""
    while True:
        try:
            await fetch_emails()
        except Exception as e:
            logger.error(f"Error in email fetcher: {str(e)}")

        await asyncio.sleep(MAIL_CHECK_INTERVAL)

# FastAPI app
app = FastAPI(title="HVAC CRM Mail Ingest Service")

# Set up logging
setup_logging(app)

# Set up exception handlers
setup_exception_handlers(app)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up request ID middleware
setup_middleware(app)

# Include health check router
app.include_router(health_router)

@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup."""
    # Only start email fetcher if mail server credentials are configured
    if all([MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD]) and MAIL_SERVER != "imap.example.com":
        logger.info("Starting email fetcher with configured mail server")
        asyncio.create_task(email_fetcher())
    else:
        logger.warning("Mail server not properly configured. Email fetcher not started.")

# API endpoints
@app.get("/")
def read_root():
    return {"status": "ok", "service": "HVAC CRM Mail Ingest Service"}

@app.get("/emails", response_model=List[EmailResponse])
def get_emails(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all emails."""
    try:
        emails = db.query(Email).offset(skip).limit(limit).all()
        return emails
    except Exception as e:
        logger.error(f"Error fetching emails: {str(e)}")
        raise DatabaseException(f"Failed to fetch emails: {str(e)}")

@app.get("/emails/{email_id}", response_model=EmailResponse)
def get_email(email_id: int, db: Session = Depends(get_db)):
    """Get a specific email by ID."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise NotFoundException("Email not found")
    return email

@app.get("/emails/{email_id}/attachments", response_model=List[AttachmentResponse])
def get_email_attachments(email_id: int, db: Session = Depends(get_db)):
    """Get all attachments for a specific email."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise NotFoundException("Email not found")

    attachments = db.query(Attachment).filter(Attachment.email_id == email_id).all()
    return attachments


@app.get("/emails/{email_id}/attachments/processed", response_model=List[AttachmentWithProcessedData])
def get_email_processed_attachments(email_id: int, db: Session = Depends(get_db)):
    """Get all attachments with processed data for a specific email."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise NotFoundException("Email not found")

    # Get attachments
    attachments = db.query(Attachment).filter(Attachment.email_id == email_id).all()
    
    # Get processed data for each attachment
    result = []
    for attachment in attachments:
        processed_data = db.query(ProcessedAttachment).filter(
            ProcessedAttachment.attachment_id == attachment.id
        ).first()
        
        # Create response object
        attachment_with_data = {
            **attachment.__dict__,
            "processed_data": processed_data
        }
        result.append(attachment_with_data)
    
    return result


@app.get("/attachments/{attachment_id}/processed", response_model=ProcessedAttachmentResponse)
def get_processed_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """Get processed data for a specific attachment."""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if attachment is None:
        raise NotFoundException("Attachment not found")

    processed_data = db.query(ProcessedAttachment).filter(
        ProcessedAttachment.attachment_id == attachment_id
    ).first()
    
    if processed_data is None:
        raise NotFoundException("Processed data not found for this attachment")
    
    return processed_data

@app.post("/webhook/email", status_code=201)
async def webhook_email(
    background_tasks: BackgroundTasks,
    from_email: str = Form(...),
    to_email: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    attachments: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Webhook endpoint for receiving emails."""
    try:
        # Create email record
        email = Email(
            message_id=str(uuid.uuid4()),
            from_email=from_email,
            to_email=to_email,
            subject=subject,
            body=body,
            received_date=datetime.utcnow(),
        )
        db.add(email)
        db.commit()
        db.refresh(email)

        # Increment email counter
        EMAIL_FETCH_COUNTER.inc()

        # Save and process attachments if any
        if attachments:
            for att in attachments:
                # Read attachment content
                content = await att.read()
                
                # Save attachment to disk
                file_path = await attachment_handler.save_attachment(
                    email_id=email.id,
                    filename=att.filename,
                    content=content
                )

                # Create attachment record
                attachment = Attachment(
                    email_id=email.id,
                    filename=att.filename,
                    content_type=att.content_type,
                    file_path=file_path,
                )
                db.add(attachment)
                db.commit()
                db.refresh(attachment)

                # Increment attachment counter
                ATTACHMENT_COUNTER.inc()

                # Process attachment with OCR and data extraction
                with ATTACHMENT_PROCESS_DURATION.time():
                    processing_result = await attachment_handler.process_attachment(
                        file_path=file_path,
                        content_type=att.content_type,
                        email_id=email.id
                    )

                # Store processing results
                processed_attachment = ProcessedAttachment(
                    attachment_id=attachment.id,
                    success=processing_result.get('success', False),
                    text_content=processing_result.get('text_content'),
                    metadata=processing_result.get('metadata'),
                    entities=processing_result.get('entities'),
                    tags=processing_result.get('tags'),
                    confidence=processing_result.get('confidence', 0.0),
                    error_message=processing_result.get('error_message'),
                    supabase_path=processing_result.get('supabase_path'),
                    public_url=processing_result.get('public_url')
                )
                db.add(processed_attachment)

                # Increment processed attachment counter
                ATTACHMENT_PROCESS_COUNTER.inc()

            db.commit()

        # Queue email for processing
        redis_client.lpush("process_email", json.dumps({"email_id": email.id}))

        return {"status": "success", "email_id": email.id}
    except Exception as e:
        logger.error(f"Error processing webhook email: {str(e)}")
        db.rollback()
        raise EmailParseException(f"Failed to process webhook email: {str(e)}")

@app.post("/manual/fetch")
async def manual_fetch(background_tasks: BackgroundTasks):
    """Manually trigger email fetching."""
    background_tasks.add_task(fetch_emails)
    return {"status": "Email fetch triggered"}

@app.post("/emails/{email_id}/reprocess")
def reprocess_email(email_id: int, db: Session = Depends(get_db)):
    """Requeue an email for processing."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise NotFoundException("Email not found")

    # Queue email for processing
    redis_client.lpush("process_email", json.dumps({"email_id": email.id}))

    return {"status": "success", "message": f"Email {email_id} requeued for processing"}


@app.post("/attachments/{attachment_id}/reprocess")
async def reprocess_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """Reprocess an attachment."""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if attachment is None:
        raise NotFoundException("Attachment not found")

    # Process attachment with OCR and data extraction
    with ATTACHMENT_PROCESS_DURATION.time():
        processing_result = await attachment_handler.process_attachment(
            file_path=attachment.file_path,
            content_type=attachment.content_type,
            email_id=attachment.email_id
        )

    # Check if processed data already exists
    processed_attachment = db.query(ProcessedAttachment).filter(
        ProcessedAttachment.attachment_id == attachment.id
    ).first()

    if processed_attachment:
        # Update existing record
        processed_attachment.success = processing_result.get('success', False)
        processed_attachment.text_content = processing_result.get('text_content')
        processed_attachment.metadata = processing_result.get('metadata')
        processed_attachment.entities = processing_result.get('entities')
        processed_attachment.tags = processing_result.get('tags')
        processed_attachment.confidence = processing_result.get('confidence', 0.0)
        processed_attachment.error_message = processing_result.get('error_message')
        processed_attachment.supabase_path = processing_result.get('supabase_path')
        processed_attachment.public_url = processing_result.get('public_url')
        processed_attachment.processed_at = datetime.utcnow()
    else:
        # Create new record
        processed_attachment = ProcessedAttachment(
            attachment_id=attachment.id,
            success=processing_result.get('success', False),
            text_content=processing_result.get('text_content'),
            metadata=processing_result.get('metadata'),
            entities=processing_result.get('entities'),
            tags=processing_result.get('tags'),
            confidence=processing_result.get('confidence', 0.0),
            error_message=processing_result.get('error_message'),
            supabase_path=processing_result.get('supabase_path'),
            public_url=processing_result.get('public_url')
        )
        db.add(processed_attachment)

    db.commit()

    # Increment processed attachment counter
    ATTACHMENT_PROCESS_COUNTER.inc()

    return {"status": "success", "message": f"Attachment {attachment_id} reprocessed"}


@app.get("/attachments/search", response_model=List[AttachmentWithProcessedData])
def search_attachments(
    q: str = Query(None, description="Search query for full-text search"),
    tags: List[str] = Query(None, description="Filter by tags"),
    entity_type: str = Query(None, description="Filter by entity type"),
    min_confidence: float = Query(0.0, description="Minimum confidence score"),
    limit: int = Query(10, description="Maximum number of results"),
    offset: int = Query(0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """Search attachments by content, tags, and entities."""
    # Start with base query
    query = db.query(Attachment, ProcessedAttachment).join(
        ProcessedAttachment,
        Attachment.id == ProcessedAttachment.attachment_id
    ).filter(
        ProcessedAttachment.success == True,
        ProcessedAttachment.confidence >= min_confidence
    )
    
    # Apply full-text search if provided
    if q:
        query = query.filter(ProcessedAttachment.text_content.ilike(f"%{q}%"))
    
    # Apply tag filter if provided
    if tags:
        for tag in tags:
            # This is a simplification - in a real SQL query you'd need to use JSON operators
            # The exact implementation depends on your database (PostgreSQL, SQLite, etc.)
            query = query.filter(ProcessedAttachment.tags.contains([tag]))
    
    # Apply entity type filter if provided
    if entity_type:
        # This is a simplification - in a real SQL query you'd need to use JSON operators
        query = query.filter(ProcessedAttachment.entities.has_key(entity_type))
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Execute query
    results = query.all()
    
    # Format results
    formatted_results = []
    for attachment, processed_data in results:
        formatted_results.append({
            **attachment.__dict__,
            "processed_data": processed_data
        })
    
    return formatted_results

@app.get("/attachments/stats")
def get_attachment_stats(db: Session = Depends(get_db)):
    """Get statistics about processed attachments."""
    try:
        # Total counts
        total_attachments = db.query(Attachment).count()
        processed_attachments = db.query(ProcessedAttachment).count()
        successful_processing = db.query(ProcessedAttachment).filter(
            ProcessedAttachment.success == True
        ).count()
        
        # Count by content type
        content_type_counts = db.query(
            Attachment.content_type, 
            db.func.count(Attachment.id)
        ).group_by(Attachment.content_type).all()
        
        # Count by tag
        tag_counts = {}
        processed_attachments_data = db.query(ProcessedAttachment).all()
        for pa in processed_attachments_data:
            if pa.tags:
                for tag in pa.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        # Count by entity type
        entity_type_counts = {}
        for pa in processed_attachments_data:
            if pa.entities:
                for entity_type in pa.entities.keys():
                    entity_type_counts[entity_type] = entity_type_counts.get(entity_type, 0) + 1
        
        # Average confidence
        avg_confidence = db.query(db.func.avg(ProcessedAttachment.confidence)).scalar() or 0
        
        return {
            "total_attachments": total_attachments,
            "processed_attachments": processed_attachments,
            "successful_processing": successful_processing,
            "processing_success_rate": successful_processing / processed_attachments if processed_attachments > 0 else 0,
            "content_type_counts": dict(content_type_counts),
            "tag_counts": tag_counts,
            "entity_type_counts": entity_type_counts,
            "average_confidence": avg_confidence
        }
    except Exception as e:
        logger.error(f"Error getting attachment stats: {str(e)}")
        raise DatabaseException(f"Error getting attachment stats: {str(e)}")


@app.get("/export/{table}")
def export_table_data(table: str, db: Session = Depends(get_db)):
    """Export data from a specific table for backup purposes."""
    if table not in ["emails", "attachments", "processed_attachments"]:
        raise ValidationException(f"Export not supported for table: {table}")

    try:
        if table == "emails":
            data = db.query(Email).all()
            result = [
                {
                    "id": email.id,
                    "message_id": email.message_id,
                    "from_email": email.from_email,
                    "to_email": email.to_email,
                    "subject": email.subject,
                    "body": email.body,
                    "received_date": email.received_date.isoformat() if email.received_date else None,
                    "processed": email.processed,
                    "created_at": email.created_at.isoformat() if email.created_at else None,
                    "updated_at": email.updated_at.isoformat() if email.updated_at else None
                }
                for email in data
            ]
        elif table == "attachments":
            data = db.query(Attachment).all()
            result = [
                {
                    "id": attachment.id,
                    "email_id": attachment.email_id,
                    "filename": attachment.filename,
                    "content_type": attachment.content_type,
                    "file_path": attachment.file_path,
                    "created_at": attachment.created_at.isoformat() if attachment.created_at else None
                }
                for attachment in data
            ]
        elif table == "processed_attachments":
            data = db.query(ProcessedAttachment).all()
            result = [
                {
                    "id": pa.id,
                    "attachment_id": pa.attachment_id,
                    "success": pa.success,
                    "confidence": pa.confidence,
                    "tags": pa.tags,
                    "entities": pa.entities,
                    "metadata": pa.metadata,
                    "error_message": pa.error_message,
                    "supabase_path": pa.supabase_path,
                    "public_url": pa.public_url,
                    "processed_at": pa.processed_at.isoformat() if pa.processed_at else None
                }
                for pa in data
            ]

        return result
    except Exception as e:
        logger.error(f"Error exporting {table} data: {str(e)}")
        raise DatabaseException(f"Error exporting data: {str(e)}")

@app.post("/import/{table}")
async def import_table_data(table: str, request: Request, db: Session = Depends(get_db)):
    """Import data to a specific table for restore purposes."""
    if table not in ["emails", "attachments", "processed_attachments"]:
        raise ValidationException(f"Import not supported for table: {table}")

    try:
        # Get JSON data from request
        data = await request.json()

        if not isinstance(data, list):
            raise ValidationException("Expected a list of records")

        # Process based on table
        if table == "emails":
            for record in data:
                # Check if email already exists
                existing = db.query(Email).filter(Email.message_id == record.get("message_id")).first()
                if existing:
                    # Update existing record
                    for key, value in record.items():
                        if key != "id" and hasattr(existing, key):
                            # Convert date strings back to datetime objects
                            if key in ["received_date", "created_at", "updated_at"] and value:
                                value = datetime.fromisoformat(value)
                            setattr(existing, key, value)
                else:
                    # Create new record
                    email = Email(
                        message_id=record.get("message_id"),
                        from_email=record.get("from_email"),
                        to_email=record.get("to_email"),
                        subject=record.get("subject"),
                        body=record.get("body"),
                        received_date=datetime.fromisoformat(record.get("received_date")) if record.get("received_date") else None,
                        processed=record.get("processed", False),
                        created_at=datetime.fromisoformat(record.get("created_at")) if record.get("created_at") else datetime.now(),
                        updated_at=datetime.fromisoformat(record.get("updated_at")) if record.get("updated_at") else datetime.now(),
                    )
                    db.add(email)

        elif table == "attachments":
            for record in data:
                # Check if attachment already exists
                existing = db.query(Attachment).filter(
                    Attachment.email_id == record.get("email_id"),
                    Attachment.filename == record.get("filename")
                ).first()

                if existing:
                    # Update existing record
                    for key, value in record.items():
                        if key != "id" and hasattr(existing, key):
                            # Convert date strings back to datetime objects
                            if key == "created_at" and value:
                                value = datetime.fromisoformat(value)
                            setattr(existing, key, value)
                else:
                    # Create new record
                    attachment = Attachment(
                        email_id=record.get("email_id"),
                        filename=record.get("filename"),
                        content_type=record.get("content_type"),
                        file_path=record.get("file_path"),
                        created_at=datetime.fromisoformat(record.get("created_at")) if record.get("created_at") else datetime.now(),
                    )
                    db.add(attachment)
                    
        elif table == "processed_attachments":
            for record in data:
                # Check if processed attachment already exists
                existing = db.query(ProcessedAttachment).filter(
                    ProcessedAttachment.attachment_id == record.get("attachment_id")
                ).first()

                if existing:
                    # Update existing record
                    for key, value in record.items():
                        if key != "id" and hasattr(existing, key):
                            # Convert date strings back to datetime objects
                            if key == "processed_at" and value:
                                value = datetime.fromisoformat(value)
                            setattr(existing, key, value)
                else:
                    # Create new record
                    processed_attachment = ProcessedAttachment(
                        attachment_id=record.get("attachment_id"),
                        success=record.get("success", False),
                        text_content=record.get("text_content"),
                        metadata=record.get("metadata"),
                        entities=record.get("entities"),
                        tags=record.get("tags"),
                        confidence=record.get("confidence", 0.0),
                        error_message=record.get("error_message"),
                        supabase_path=record.get("supabase_path"),
                        public_url=record.get("public_url"),
                        processed_at=datetime.fromisoformat(record.get("processed_at")) if record.get("processed_at") else datetime.now(),
                    )
                    db.add(processed_attachment)

        # Commit changes
        db.commit()

        return {"status": "success", "message": f"Imported {len(data)} records to {table}"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error importing {table} data: {str(e)}")
        raise DatabaseException(f"Error importing data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)