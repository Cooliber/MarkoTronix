from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, Response
import httpx
import os
import logging
from typing import Any, Dict, List, Optional
from ...core.security import get_current_user
from ...models.user import User
from ...core.circuit_breaker import create_circuit_breaker, CircuitBreakerOpenError

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/offers", tags=["offers"])

OFFER_SERVICE_URL = os.getenv("OFFER_SERVICE_URL", "http://offer-generation:8000")

# Create circuit breaker for offer service
offer_circuit = create_circuit_breaker(
    name="offer-service",
    failure_threshold=3,
    recovery_timeout=30.0,
    expected_exceptions=(httpx.HTTPError, httpx.ConnectError, httpx.TimeoutException)
)

@router.get("/")
async def get_offers(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Proxy endpoint to get all offers from the offer generation service.
    """
    async def fetch_offers():
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OFFER_SERVICE_URL}/offers",
                params={"skip": skip, "limit": limit},
                timeout=10.0  # Add timeout for better resilience
            )
            response.raise_for_status()
            return response.json()

    try:
        # Use circuit breaker to protect the call
        return await offer_circuit.call(fetch_offers)
    except CircuitBreakerOpenError:
        logger.error("Circuit breaker open for offer service - returning empty list")
        # Return a fallback response when the circuit is open
        return []
    except httpx.HTTPError as e:
        logger.error(f"Error fetching offers: {str(e)}")
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, "response") else 500,
            detail=f"Error fetching offers: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching offers: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/{offer_id}")
async def get_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to get a specific offer from the offer generation service.
    """
    async def fetch_offer():
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OFFER_SERVICE_URL}/offers/{offer_id}",
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()

    try:
        # Use circuit breaker to protect the call
        return await offer_circuit.call(fetch_offer)
    except CircuitBreakerOpenError:
        logger.error(f"Circuit breaker open for offer service - returning empty offer for ID {offer_id}")
        # Return a fallback response when the circuit is open
        return {
            "id": offer_id,
            "status": "unknown",
            "message": "Service temporarily unavailable",
            "created_at": None,
            "updated_at": None
        }
    except httpx.HTTPError as e:
        logger.error(f"Error fetching offer {offer_id}: {str(e)}")
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, "response") else 500,
            detail=f"Error fetching offer: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching offer {offer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.post("/generate")
async def generate_offer(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to generate a new offer.
    """
    body = await request.json()

    async def create_offer():
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OFFER_SERVICE_URL}/offers/generate",
                json=body,
                timeout=30.0  # Longer timeout for generation which may take time
            )
            response.raise_for_status()
            return response.json()

    try:
        # Use circuit breaker to protect the call
        return await offer_circuit.call(create_offer)
    except CircuitBreakerOpenError:
        logger.error("Circuit breaker open for offer service - cannot generate offer")
        # This is a critical operation, so we should fail rather than return a placeholder
        raise HTTPException(
            status_code=503,
            detail="Offer generation service is temporarily unavailable. Please try again later."
        )
    except httpx.HTTPError as e:
        logger.error(f"Error generating offer: {str(e)}")
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, "response") else 500,
            detail=f"Error generating offer: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error generating offer: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/{offer_id}/pdf")
async def get_offer_pdf(
    offer_id: int,
    current_user: User = Depends(get_current_user)
) -> Response:
    """
    Proxy endpoint to get the PDF for an offer.
    """
    async def fetch_pdf():
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OFFER_SERVICE_URL}/offers/{offer_id}/pdf",
                timeout=15.0
            )
            response.raise_for_status()
            return response.content

    try:
        # Use circuit breaker to protect the call
        pdf_content = await offer_circuit.call(fetch_pdf)

        # Return the PDF content with the correct content type
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=offer_{offer_id}.pdf"
            }
        )
    except CircuitBreakerOpenError:
        logger.error(f"Circuit breaker open for offer service - cannot fetch PDF for offer {offer_id}")
        raise HTTPException(
            status_code=503,
            detail="PDF generation service is temporarily unavailable. Please try again later."
        )
    except httpx.HTTPError as e:
        logger.error(f"Error fetching offer PDF for offer {offer_id}: {str(e)}")
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, "response") else 500,
            detail=f"Error fetching offer PDF: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching offer PDF for offer {offer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )