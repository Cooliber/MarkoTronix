import os
import logging
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import uuid
import json

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request, Response, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from jose import JWTError, jwt
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/hvac_crm")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
JWT_EXPIRATION = os.getenv("JWT_EXPIRATION", "24h")
STORAGE_PATH = Path(os.getenv("STORAGE_PATH", "/app/storage"))

# DocuSign settings
DOCUSIGN_CLIENT_ID = os.getenv("DOCUSIGN_CLIENT_ID")
DOCUSIGN_CLIENT_SECRET = os.getenv("DOCUSIGN_CLIENT_SECRET")
DOCUSIGN_ACCOUNT_ID = os.getenv("DOCUSIGN_ACCOUNT_ID")
DOCUSIGN_USER_ID = os.getenv("DOCUSIGN_USER_ID")
DOCUSIGN_BASE_PATH = os.getenv("DOCUSIGN_BASE_PATH", "https://demo.docusign.net/restapi")

# HelloSign settings
HELLOSIGN_API_KEY = os.getenv("HELLOSIGN_API_KEY")

# Ensure storage directory exists
STORAGE_PATH.mkdir(exist_ok=True, parents=True)

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=True)
    client_name = Column(String)
    client_email = Column(String, nullable=True)
    client_phone = Column(String, nullable=True)
    client_address = Column(String, nullable=True)
    service_type = Column(String)
    description = Column(Text)
    price = Column(Float)
    currency = Column(String, default="PLN")
    valid_until = Column(DateTime)
    html_content = Column(Text)
    pdf_path = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, sent, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SignatureRequest(Base):
    __tablename__ = "signature_requests"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id"))
    provider = Column(String)  # docusign, hellosign
    request_id = Column(String)  # ID from the e-signature provider
    status = Column(String, default="pending")  # pending, sent, signed, declined, expired
    signing_url = Column(String, nullable=True)
    request_data = Column(JSON, nullable=True)  # Renamed from metadata to avoid SQLAlchemy reserved name
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class SignatureRequestCreate(BaseModel):
    offer_id: int
    provider: str = "docusign"  # docusign, hellosign

class SignatureRequestResponse(BaseModel):
    id: int
    offer_id: int
    provider: str
    request_id: str
    status: str
    signing_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class TokenData(BaseModel):
    sub: str
    type: str
    exp: Optional[datetime] = None

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def parse_jwt_expiration(expiration: str) -> timedelta:
    """Parse JWT expiration string to timedelta."""
    if expiration.endswith('h'):
        return timedelta(hours=int(expiration[:-1]))
    elif expiration.endswith('d'):
        return timedelta(days=int(expiration[:-1]))
    elif expiration.endswith('m'):
        return timedelta(minutes=int(expiration[:-1]))
    else:
        return timedelta(hours=24)  # Default to 24 hours

def create_jwt_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + parse_jwt_expiration(JWT_EXPIRATION)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

    return encoded_jwt

def verify_jwt_token(token: str) -> TokenData:
    """Verify a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        token_data = TokenData(**payload)
        return token_data
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def create_docusign_signature_request(offer_id: int, db: Session) -> Dict[str, Any]:
    """Create a signature request using DocuSign."""
    if not all([DOCUSIGN_CLIENT_ID, DOCUSIGN_CLIENT_SECRET, DOCUSIGN_ACCOUNT_ID]):
        raise ValueError("DocuSign credentials not configured")

    # Get offer from database
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise ValueError(f"Offer {offer_id} not found")

    if not offer.pdf_path or not os.path.exists(offer.pdf_path):
        raise ValueError(f"PDF not found for offer {offer_id}")

    # Initialize DocuSign client
    from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs

    # Create API client
    api_client = ApiClient()
    api_client.host = DOCUSIGN_BASE_PATH

    # TODO: Implement OAuth2 authentication flow
    # For simplicity, we'll use a pre-generated access token
    # In production, you would implement the full OAuth2 flow

    # Create envelope definition
    envelope_definition = EnvelopeDefinition(
        email_subject=f"Please sign your HVAC service offer #{offer_id}",
        status="sent",  # created, sent
    )

    # Add document to envelope
    with open(offer.pdf_path, "rb") as file:
        document_base64 = base64.b64encode(file.read()).decode("utf-8")

    document = Document(
        document_base64=document_base64,
        name=f"HVAC Service Offer #{offer_id}",
        file_extension="pdf",
        document_id="1",
    )
    envelope_definition.documents = [document]

    # Add signer to envelope
    signer = Signer(
        email=offer.client_email,
        name=offer.client_name,
        recipient_id="1",
        routing_order="1",
    )

    # Add signature tab
    sign_here = SignHere(
        document_id="1",
        page_number="1",
        recipient_id="1",
        tab_label="SignHereTab",
        x_position="100",
        y_position="100",
    )
    tabs = Tabs(sign_here_tabs=[sign_here])
    signer.tabs = tabs

    envelope_definition.recipients = {"signers": [signer]}

    # Create envelope
    envelopes_api = EnvelopesApi(api_client)
    envelope_summary = envelopes_api.create_envelope(DOCUSIGN_ACCOUNT_ID, envelope_definition=envelope_definition)

    # Get signing URL
    from docusign_esign import RecipientViewRequest
    recipient_view_request = RecipientViewRequest(
        authentication_method="email",
        client_user_id=offer.client_email,
        recipient_id="1",
        return_url=f"http://localhost:8002/signature/callback?offer_id={offer_id}",
        user_name=offer.client_name,
        email=offer.client_email,
    )

    recipient_view = envelopes_api.create_recipient_view(
        DOCUSIGN_ACCOUNT_ID,
        envelope_summary.envelope_id,
        recipient_view_request=recipient_view_request,
    )

    return {
        "request_id": envelope_summary.envelope_id,
        "signing_url": recipient_view.url,
        "status": envelope_summary.status,
    }

async def create_hellosign_signature_request(offer_id: int, db: Session) -> Dict[str, Any]:
    """Create a signature request using HelloSign."""
    if not HELLOSIGN_API_KEY:
        raise ValueError("HelloSign API key not configured")

    # Get offer from database
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise ValueError(f"Offer {offer_id} not found")

    if not offer.pdf_path or not os.path.exists(offer.pdf_path):
        raise ValueError(f"PDF not found for offer {offer_id}")

    # Initialize HelloSign client
    from hellosign_sdk import HSClient

    client = HSClient(api_key=HELLOSIGN_API_KEY)

    # Create signature request
    response = client.send_signature_request(
        test_mode=True,
        title=f"HVAC Service Offer #{offer_id}",
        subject=f"Please sign your HVAC service offer #{offer_id}",
        message="Please review and sign this service offer.",
        signers=[
            {
                "email_address": offer.client_email,
                "name": offer.client_name,
                "order": 0,
            }
        ],
        files=[offer.pdf_path],
        metadata={
            "offer_id": str(offer_id),
        },
        client_id=HELLOSIGN_API_KEY,
    )

    return {
        "request_id": response.signature_request_id,
        "signing_url": response.signing_url,
        "status": "sent",
    }

# FastAPI app
app = FastAPI(title="HVAC CRM Link & e-Podpis Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/storage", StaticFiles(directory=str(STORAGE_PATH)), name="storage")

# API endpoints
@app.get("/")
def read_root():
    return {"status": "ok", "service": "HVAC CRM Link & e-Podpis Service"}

@app.get("/offers/{offer_id}/link")
def generate_offer_link(offer_id: int, db: Session = Depends(get_db)):
    """Generate a short-lived link to view an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Create token with expiry
    token_data = {
        "sub": str(offer_id),
        "type": "offer_view",
    }
    token = create_jwt_token(token_data)

    # Generate link
    link = f"/offers/view/{token}"

    return {"link": link, "expires_in": JWT_EXPIRATION}

@app.get("/offers/view/{token}")
def view_offer(token: str, db: Session = Depends(get_db)):
    """View an offer using a token."""
    try:
        token_data = verify_jwt_token(token)
        if token_data.type != "offer_view":
            raise HTTPException(status_code=400, detail="Invalid token type")

        offer_id = int(token_data.sub)
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if offer is None:
            raise HTTPException(status_code=404, detail="Offer not found")

        # If PDF is available, redirect to it
        if offer.pdf_path:
            return RedirectResponse(url=f"/offers/{offer_id}/pdf")

        # Otherwise, return the HTML content
        return JSONResponse(content={"html": offer.html_content})

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/offers/{offer_id}/pdf")
def get_offer_pdf(offer_id: int, db: Session = Depends(get_db)):
    """Get the PDF file of an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")

    if not offer.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not yet generated for this offer")

    pdf_path = Path(offer.pdf_path)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")

    return FileResponse(
        path=pdf_path,
        filename=f"offer_{offer_id}.pdf",
        media_type="application/pdf"
    )

@app.post("/signature/request", response_model=SignatureRequestResponse)
async def create_signature_request(
    request: SignatureRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new signature request."""
    offer_id = request.offer_id
    provider = request.provider.lower()

    # Validate provider
    valid_providers = ["docusign", "hellosign"]
    if provider not in valid_providers:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
        )

    # Check if offer exists
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Check if client email is available
    if not offer.client_email:
        raise HTTPException(
            status_code=400,
            detail="Client email is required for signature requests"
        )

    # Create signature request in database
    signature_request = SignatureRequest(
        offer_id=offer_id,
        provider=provider,
        request_id="pending",
        status="pending",
    )
    db.add(signature_request)
    db.commit()
    db.refresh(signature_request)

    # Create signature request in background
    background_tasks.add_task(process_signature_request, signature_request.id)

    return signature_request

@app.get("/signature/requests", response_model=List[SignatureRequestResponse])
def get_signature_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all signature requests."""
    requests = db.query(SignatureRequest).offset(skip).limit(limit).all()
    return requests

@app.get("/signature/requests/{request_id}", response_model=SignatureRequestResponse)
def get_signature_request(request_id: int, db: Session = Depends(get_db)):
    """Get a specific signature request by ID."""
    request = db.query(SignatureRequest).filter(SignatureRequest.id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Signature request not found")
    return request

@app.post("/signature/callback")
async def signature_callback(request: Request, db: Session = Depends(get_db)):
    """Callback endpoint for signature providers."""
    # Parse request body
    body = await request.body()

    try:
        # Try to parse as JSON
        data = json.loads(body)
    except json.JSONDecodeError:
        # If not JSON, parse as form data
        form = await request.form()
        data = dict(form)

    logger.info(f"Signature callback received: {data}")

    # Extract relevant information based on provider
    provider = data.get("provider", "unknown")

    if provider == "docusign":
        # DocuSign callback
        envelope_id = data.get("envelopeId")
        status = data.get("status")

        if envelope_id:
            # Find signature request by request_id
            signature_request = db.query(SignatureRequest).filter(
                SignatureRequest.request_id == envelope_id,
                SignatureRequest.provider == "docusign"
            ).first()

            if signature_request:
                # Update status
                signature_request.status = status.lower() if status else "unknown"
                signature_request.updated_at = datetime.utcnow()

                # If signed, update offer status
                if status and status.lower() == "completed":
                    offer = db.query(Offer).filter(Offer.id == signature_request.offer_id).first()
                    if offer:
                        offer.status = "accepted"
                        offer.updated_at = datetime.utcnow()

                db.commit()

    elif provider == "hellosign":
        # HelloSign callback
        event_type = data.get("event", {}).get("event_type")
        signature_request_id = data.get("signature_request", {}).get("signature_request_id")

        if signature_request_id:
            # Find signature request by request_id
            signature_request = db.query(SignatureRequest).filter(
                SignatureRequest.request_id == signature_request_id,
                SignatureRequest.provider == "hellosign"
            ).first()

            if signature_request:
                # Map HelloSign event types to status
                status_map = {
                    "signature_request_sent": "sent",
                    "signature_request_viewed": "viewed",
                    "signature_request_signed": "signed",
                    "signature_request_declined": "declined",
                    "signature_request_expired": "expired",
                }

                status = status_map.get(event_type, signature_request.status)

                # Update status
                signature_request.status = status
                signature_request.updated_at = datetime.utcnow()

                # If signed, update offer status
                if status == "signed":
                    offer = db.query(Offer).filter(Offer.id == signature_request.offer_id).first()
                    if offer:
                        offer.status = "accepted"
                        offer.updated_at = datetime.utcnow()

                db.commit()

    return {"status": "success"}

# Background tasks
async def process_signature_request(request_id: int):
    """Process a signature request."""
    db = SessionLocal()
    try:
        # Get signature request from database
        signature_request = db.query(SignatureRequest).filter(SignatureRequest.id == request_id).first()
        if not signature_request:
            logger.error(f"Signature request {request_id} not found")
            return

        # Process based on provider
        try:
            if signature_request.provider == "docusign":
                result = await create_docusign_signature_request(signature_request.offer_id, db)
            elif signature_request.provider == "hellosign":
                result = await create_hellosign_signature_request(signature_request.offer_id, db)
            else:
                raise ValueError(f"Unsupported provider: {signature_request.provider}")

            # Update signature request with result
            signature_request.request_id = result["request_id"]
            signature_request.signing_url = result["signing_url"]
            signature_request.status = result["status"]
            signature_request.updated_at = datetime.utcnow()

            # Update offer status
            offer = db.query(Offer).filter(Offer.id == signature_request.offer_id).first()
            if offer:
                offer.status = "sent"
                offer.updated_at = datetime.utcnow()

            db.commit()

            logger.info(f"Signature request {request_id} processed successfully")

        except Exception as e:
            logger.error(f"Error processing signature request {request_id}: {str(e)}")

            # Update signature request with error
            signature_request.status = "error"
            signature_request.request_data = {"error": str(e)}
            signature_request.updated_at = datetime.utcnow()
            db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)