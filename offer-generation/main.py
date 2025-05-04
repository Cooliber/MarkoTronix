import os
import json
import logging
import asyncio
import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import uuid

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, File, UploadFile, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from jose import JWTError, jwt
from tenacity import retry, stop_after_attempt, wait_exponential
import jinja2

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/hvac_crm")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1")
DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "gpt-3.5-turbo")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
STORAGE_PATH = Path(os.getenv("STORAGE_PATH", "/app/storage"))

# Ensure storage directory exists
STORAGE_PATH.mkdir(exist_ok=True, parents=True)

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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

class EmailEntity(Base):
    __tablename__ = "email_entities"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    client_name = Column(String, nullable=True)
    client_email = Column(String, nullable=True)
    client_phone = Column(String, nullable=True)
    client_address = Column(String, nullable=True)
    intent = Column(String, nullable=True)
    service_type = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    estimated_price = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    raw_extraction = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class OfferBase(BaseModel):
    client_name: str
    client_email: Optional[EmailStr] = None
    client_phone: Optional[str] = None
    client_address: Optional[str] = None
    service_type: str
    description: str
    price: float
    currency: str = "PLN"
    valid_days: int = 30

class OfferCreate(OfferBase):
    email_id: Optional[int] = None

class OfferResponse(OfferBase):
    id: int
    email_id: Optional[int] = None
    valid_until: datetime
    pdf_path: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class OfferGenerateRequest(BaseModel):
    email_id: int

class OfferUpdateStatus(BaseModel):
    status: str = Field(..., description="New status: draft, sent, accepted, rejected")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def call_llm_api(
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.7,
    use_openrouter: bool = True
) -> str:
    """Call LLM API (OpenRouter or OpenAI) with retry logic."""
    if not model:
        model = DEFAULT_LLM_MODEL
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    if use_openrouter and OPENROUTER_API_KEY:
        # Use OpenRouter
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hvac-crm.example.com",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OPENROUTER_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60,
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    elif OPENAI_API_KEY:
        # Use OpenAI directly
        import openai
        openai.api_key = OPENAI_API_KEY
        
        response = await openai.ChatCompletion.acreate(
            model=model,
            messages=messages,
            temperature=temperature,
        )
        return response.choices[0].message.content
    
    else:
        raise ValueError("No API key provided for LLM service")

async def generate_offer_content(client_data: Dict[str, Any], service_type: str, description: str, price: float, currency: str, valid_until: datetime) -> str:
    """Generate HTML content for the offer using LLM."""
    system_prompt = """
    You are an AI assistant for a HVAC (Heating, Ventilation, and Air Conditioning) company.
    Your task is to generate a professional offer/quote for a client based on the provided information.
    The response should be in HTML format, ready to be rendered as a PDF.
    Include a professional header, client information, service details, pricing, terms, and a signature section.
    Make it visually appealing and professional.
    """
    
    prompt = f"""
    Generate a professional HVAC service offer with the following details:
    
    Client Information:
    - Name: {client_data.get('client_name', 'N/A')}
    - Email: {client_data.get('client_email', 'N/A')}
    - Phone: {client_data.get('client_phone', 'N/A')}
    - Address: {client_data.get('client_address', 'N/A')}
    
    Service Information:
    - Type: {service_type}
    - Description: {description}
    - Price: {price} {currency}
    - Valid Until: {valid_until.strftime('%Y-%m-%d')}
    
    Include the following sections:
    1. Professional header with company logo placeholder
    2. Client information
    3. Service details
    4. Pricing breakdown
    5. Terms and conditions
    6. Signature section for client acceptance
    
    The HTML should be styled with CSS for a professional appearance.
    """
    
    html_content = await call_llm_api(prompt, system_prompt)
    
    # Ensure the response is valid HTML
    if not html_content.strip().startswith("<"):
        html_content = f"<html><body>{html_content}</body></html>"
    
    return html_content

async def generate_pdf_from_html(html_content: str, output_path: Path) -> Path:
    """Generate PDF from HTML content using WeasyPrint."""
    from weasyprint import HTML
    
    # Ensure the directory exists
    output_path.parent.mkdir(exist_ok=True, parents=True)
    
    # Generate PDF
    HTML(string=html_content).write_pdf(output_path)
    
    return output_path

async def generate_pdf_with_puppeteer(html_content: str, output_path: Path) -> Path:
    """Generate PDF from HTML content using Puppeteer."""
    from pyppeteer import launch
    
    # Ensure the directory exists
    output_path.parent.mkdir(exist_ok=True, parents=True)
    
    # Write HTML to a temporary file
    temp_html_path = output_path.with_suffix('.html')
    with open(temp_html_path, 'w') as f:
        f.write(html_content)
    
    # Launch browser and generate PDF
    browser = await launch(
        args=['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath='/usr/bin/chromium',
    )
    page = await browser.newPage()
    await page.goto(f'file://{temp_html_path}', {'waitUntil': 'networkidle0'})
    await page.pdf({'path': str(output_path), 'format': 'A4', 'printBackground': True})
    await browser.close()
    
    # Clean up temporary HTML file
    temp_html_path.unlink()
    
    return output_path

def create_jwt_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    
    return encoded_jwt

# FastAPI app
app = FastAPI(title="HVAC CRM Offer Generation Service")

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
    return {"status": "ok", "service": "HVAC CRM Offer Generation Service"}

@app.post("/offers", response_model=OfferResponse, status_code=201)
async def create_offer(
    offer: OfferCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new offer."""
    # Calculate valid_until date
    valid_until = datetime.utcnow() + timedelta(days=offer.valid_days)
    
    # Generate HTML content
    client_data = {
        "client_name": offer.client_name,
        "client_email": offer.client_email,
        "client_phone": offer.client_phone,
        "client_address": offer.client_address,
    }
    
    html_content = await generate_offer_content(
        client_data,
        offer.service_type,
        offer.description,
        offer.price,
        offer.currency,
        valid_until
    )
    
    # Create offer in database
    db_offer = Offer(
        email_id=offer.email_id,
        client_name=offer.client_name,
        client_email=offer.client_email,
        client_phone=offer.client_phone,
        client_address=offer.client_address,
        service_type=offer.service_type,
        description=offer.description,
        price=offer.price,
        currency=offer.currency,
        valid_until=valid_until,
        html_content=html_content,
        status="draft",
    )
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    
    # Generate PDF in background
    background_tasks.add_task(generate_pdf_for_offer, db_offer.id)
    
    return db_offer

@app.post("/offers/generate", response_model=OfferResponse)
async def generate_offer_from_email(
    request: OfferGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate an offer from email data."""
    email_id = request.email_id
    
    # Get email and entity data
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail=f"Email with ID {email_id} not found")
    
    entity = db.query(EmailEntity).filter(EmailEntity.email_id == email_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"No entity data found for email {email_id}")
    
    # Create offer data
    valid_until = datetime.utcnow() + timedelta(days=30)
    
    # Extract price from estimated_price field
    price = 0.0
    if entity.estimated_price:
        # Try to extract a numeric value from the estimated_price string
        import re
        price_match = re.search(r'(\d+(?:\.\d+)?)', entity.estimated_price)
        if price_match:
            price = float(price_match.group(1))
    
    # Generate HTML content
    client_data = {
        "client_name": entity.client_name or "Client",
        "client_email": entity.client_email,
        "client_phone": entity.client_phone,
        "client_address": entity.client_address,
    }
    
    service_type = entity.service_type or "HVAC Service"
    description = f"Service requested via email: {email.subject}\n\n"
    if entity.notes:
        description += f"Notes: {entity.notes}"
    
    html_content = await generate_offer_content(
        client_data,
        service_type,
        description,
        price,
        "PLN",
        valid_until
    )
    
    # Create offer in database
    db_offer = Offer(
        email_id=email_id,
        client_name=entity.client_name or "Client",
        client_email=entity.client_email,
        client_phone=entity.client_phone,
        client_address=entity.client_address,
        service_type=service_type,
        description=description,
        price=price,
        currency="PLN",
        valid_until=valid_until,
        html_content=html_content,
        status="draft",
    )
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    
    # Generate PDF in background
    background_tasks.add_task(generate_pdf_for_offer, db_offer.id)
    
    return db_offer

@app.get("/offers", response_model=List[OfferResponse])
def get_offers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all offers."""
    offers = db.query(Offer).offset(skip).limit(limit).all()
    return offers

@app.get("/offers/{offer_id}", response_model=OfferResponse)
def get_offer(offer_id: int, db: Session = Depends(get_db)):
    """Get a specific offer by ID."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer

@app.get("/offers/{offer_id}/html")
def get_offer_html(offer_id: int, db: Session = Depends(get_db)):
    """Get the HTML content of an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    return JSONResponse(content={"html": offer.html_content})

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

@app.put("/offers/{offer_id}/status", response_model=OfferResponse)
def update_offer_status(offer_id: int, status_update: OfferUpdateStatus, db: Session = Depends(get_db)):
    """Update the status of an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Validate status
    valid_statuses = ["draft", "sent", "accepted", "rejected"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Update status
    offer.status = status_update.status
    offer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(offer)
    
    return offer

@app.post("/offers/{offer_id}/regenerate-pdf")
async def regenerate_pdf(offer_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Regenerate the PDF for an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Generate PDF in background
    background_tasks.add_task(generate_pdf_for_offer, offer.id)
    
    return {"status": "success", "message": "PDF regeneration started"}

@app.get("/offers/{offer_id}/token")
def get_offer_token(offer_id: int, db: Session = Depends(get_db)):
    """Generate a JWT token for accessing the offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Create token with 24-hour expiry
    token_data = {
        "sub": str(offer_id),
        "type": "offer_access",
    }
    token = create_jwt_token(token_data, timedelta(hours=24))
    
    return {"token": token}

# Background tasks
async def generate_pdf_for_offer(offer_id: int):
    """Generate PDF for an offer and update the database."""
    db = SessionLocal()
    try:
        # Get offer from database
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            logger.error(f"Offer {offer_id} not found")
            return
        
        # Create PDF filename and path
        pdf_filename = f"offer_{offer_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
        pdf_dir = STORAGE_PATH / "offers" / str(offer_id)
        pdf_dir.mkdir(exist_ok=True, parents=True)
        pdf_path = pdf_dir / pdf_filename
        
        # Generate PDF
        try:
            await generate_pdf_with_puppeteer(offer.html_content, pdf_path)
        except Exception as e:
            logger.error(f"Error generating PDF with Puppeteer: {str(e)}")
            # Fallback to WeasyPrint
            await generate_pdf_from_html(offer.html_content, pdf_path)
        
        # Update offer with PDF path
        offer.pdf_path = str(pdf_path)
        db.commit()
        
        logger.info(f"PDF generated for offer {offer_id}: {pdf_path}")
    
    except Exception as e:
        logger.error(f"Error generating PDF for offer {offer_id}: {str(e)}")
    
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)