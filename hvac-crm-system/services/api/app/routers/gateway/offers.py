from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, Response
import httpx
import os
from typing import Any, Dict, List, Optional
from ...core.security import get_current_user
from ...models.user import User

router = APIRouter(prefix="/offers", tags=["offers"])

OFFER_SERVICE_URL = os.getenv("OFFER_SERVICE_URL", "http://offer-generation:8000")

@router.get("/")
async def get_offers(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Proxy endpoint to get all offers from the offer generation service.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{OFFER_SERVICE_URL}/offers",
                params={"skip": skip, "limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error fetching offers: {str(e)}"
            )

@router.get("/{offer_id}")
async def get_offer(
    offer_id: int, 
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to get a specific offer from the offer generation service.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{OFFER_SERVICE_URL}/offers/{offer_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error fetching offer: {str(e)}"
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
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{OFFER_SERVICE_URL}/offers/generate",
                json=body
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error generating offer: {str(e)}"
            )

@router.get("/{offer_id}/pdf")
async def get_offer_pdf(
    offer_id: int, 
    current_user: User = Depends(get_current_user)
) -> Response:
    """
    Proxy endpoint to get the PDF for an offer.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{OFFER_SERVICE_URL}/offers/{offer_id}/pdf")
            response.raise_for_status()
            
            # Return the PDF content with the correct content type
            return Response(
                content=response.content,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename=offer_{offer_id}.pdf"
                }
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error fetching offer PDF: {str(e)}"
            )