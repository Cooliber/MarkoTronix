import os
import asyncio
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, File, UploadFile, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from imap_tools import MailBox, AND
import redis
import json
import uuid
import shutil
from pathlib import Path
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

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
Base = declarative_base()

# Redis setup
redis_client = redis.from_url(REDIS_URL)

# Database models
class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True)
    from_email = Column(String)
    to_email = Column(String)
    subject = Column(String)
    body = Column(Text)
    received_date = Column(DateTime)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    filename = Column(String)
    content_type = Column(String)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables if they don't exist
from sqlalchemy import inspect
inspector = inspect(engine)
if not inspector.has_table("emails") or not inspector.has_table("attachments"):
    Base.metadata.create_all(bind=engine)
else:
    logger.info("Tables already exist, skipping creation")

# Pydantic models
class EmailBase(BaseModel):
    from_email: EmailStr
    to_email: EmailStr
    subject: str
    body: str

class EmailCreate(EmailBase):
    pass

class EmailResponse(EmailBase):
    id: int
    message_id: str
    received_date: datetime
    processed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AttachmentBase(BaseModel):
    filename: str
    content_type: str

class AttachmentCreate(AttachmentBase):
    file_path: str

class AttachmentResponse(AttachmentBase):
    id: int
    email_id: int
    file_path: str
    created_at: datetime

    class Config:
        orm_mode = True

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper function for Supabase storage
async def upload_to_supabase(file_path, bucket_name="email-attachments"):
    """Upload a file to Supabase Storage"""
    if not supabase:
        logger.warning("Supabase not configured. Skipping upload.")
        return None

    try:
        with open(file_path, "rb") as f:
            file_content = f.read()

        # Create a unique path in the bucket
        storage_path = f"{uuid.uuid4()}/{Path(file_path).name}"

        # Upload to Supabase
        response = supabase.storage.from_(bucket_name).upload(
            storage_path,
            file_content
        )

        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)

        return {
            "storage_path": storage_path,
            "public_url": public_url
        }
    except Exception as e:
        logger.error(f"Error uploading to Supabase: {str(e)}")
        return None

# FastAPI app
app = FastAPI(title="HVAC CRM Mail Ingest Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background tasks
async def fetch_emails():
    """Fetch emails from the mail server and store them in the database."""
    if not all([MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD]):
        logger.warning("Mail server credentials not configured. Skipping email fetch.")
        return

    logger.info(f"Connecting to mail server {MAIL_SERVER}:{MAIL_PORT}")

    try:
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

                # Save attachments
                for att in msg.attachments:
                    attachment_dir = ATTACHMENTS_DIR / str(email.id)
                    attachment_dir.mkdir(exist_ok=True)

                    file_path = attachment_dir / att.filename
                    with open(file_path, 'wb') as f:
                        f.write(att.payload)

                    # Upload to Supabase if configured
                    supabase_info = None
                    if supabase:
                        supabase_info = await upload_to_supabase(file_path)

                    attachment = Attachment(
                        email_id=email.id,
                        filename=att.filename,
                        content_type=att.content_type,
                        file_path=str(file_path) if not supabase_info else supabase_info.get("public_url"),
                    )
                    db.add(attachment)

                db.commit()

                # Queue email for processing
                redis_client.lpush("process_email", json.dumps({"email_id": email.id}))
                logger.info(f"Email {email.id} queued for processing")

                db.close()
    except Exception as e:
        logger.error(f"Error fetching emails: {str(e)}")

async def email_fetcher():
    """Background task to periodically fetch emails."""
    while True:
        try:
            await fetch_emails()
        except Exception as e:
            logger.error(f"Error in email fetcher: {str(e)}")

        await asyncio.sleep(MAIL_CHECK_INTERVAL)

@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup."""
    asyncio.create_task(email_fetcher())

# API endpoints
@app.get("/")
def read_root():
    return {"status": "ok", "service": "HVAC CRM Mail Ingest Service"}

@app.get("/emails", response_model=List[EmailResponse])
def get_emails(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all emails."""
    emails = db.query(Email).offset(skip).limit(limit).all()
    return emails

@app.get("/emails/{email_id}", response_model=EmailResponse)
def get_email(email_id: int, db: Session = Depends(get_db)):
    """Get a specific email by ID."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@app.get("/emails/{email_id}/attachments", response_model=List[AttachmentResponse])
def get_email_attachments(email_id: int, db: Session = Depends(get_db)):
    """Get all attachments for a specific email."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if email is None:
        raise HTTPException(status_code=404, detail="Email not found")

    attachments = db.query(Attachment).filter(Attachment.email_id == email_id).all()
    return attachments

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

    # Save attachments if any
    if attachments:
        attachment_dir = ATTACHMENTS_DIR / str(email.id)
        attachment_dir.mkdir(exist_ok=True)

        for att in attachments:
            file_path = attachment_dir / att.filename
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(att.file, f)

            # Upload to Supabase if configured
            supabase_info = None
            if supabase:
                supabase_info = await upload_to_supabase(file_path)

            attachment = Attachment(
                email_id=email.id,
                filename=att.filename,
                content_type=att.content_type,
                file_path=str(file_path) if not supabase_info else supabase_info.get("public_url"),
            )
            db.add(attachment)

        db.commit()

    # Queue email for processing
    redis_client.lpush("process_email", json.dumps({"email_id": email.id}))

    return {"status": "success", "email_id": email.id}

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
        raise HTTPException(status_code=404, detail="Email not found")

    # Queue email for processing
    redis_client.lpush("process_email", json.dumps({"email_id": email.id}))

    return {"status": "success", "message": f"Email {email_id} requeued for processing"}

@app.get("/export/{table}")
def export_table_data(table: str, db: Session = Depends(get_db)):
    """Export data from a specific table for backup purposes."""
    if table not in ["emails", "attachments"]:
        raise HTTPException(status_code=400, detail=f"Export not supported for table: {table}")

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

        return result
    except Exception as e:
        logger.error(f"Error exporting {table} data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")

@app.post("/import/{table}")
async def import_table_data(table: str, request: Request, db: Session = Depends(get_db)):
    """Import data to a specific table for restore purposes."""
    if table not in ["emails", "attachments"]:
        raise HTTPException(status_code=400, detail=f"Import not supported for table: {table}")

    try:
        # Get JSON data from request
        data = await request.json()

        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="Expected a list of records")

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

        # Commit changes
        db.commit()

        return {"status": "success", "message": f"Imported {len(data)} records to {table}"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error importing {table} data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error importing data: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint for container monitoring."""
    # Check database connection
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
    finally:
        db.close()

    # Check Redis connection
    try:
        redis_client.ping()
        redis_status = "ok"
    except Exception as e:
        redis_status = f"error: {str(e)}"

    # Check Supabase connection if configured
    supabase_status = "not configured"
    if supabase:
        try:
            # Simple test query
            supabase.table("emails").select("id").limit(1).execute()
            supabase_status = "ok"
        except Exception as e:
            supabase_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "service": "HVAC CRM Mail Ingest Service",
        "timestamp": datetime.now(datetime.timezone.utc).isoformat(),
        "dependencies": {
            "database": db_status,
            "redis": redis_status,
            "supabase": supabase_status
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)