from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Any, Dict, List, Optional
from ...core.security import get_current_user
from ...models.user import User

router = APIRouter(prefix="/links", tags=["links"])

LINK_SERVICE_URL = os.getenv("LINK_SERVICE_URL", "http://link-service:8000")

@router.get("/offers/{offer_id}/link")
async def get_offer_link(
    offer_id: int, 
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to generate a shareable link for an offer.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{LINK_SERVICE_URL}/offers/{offer_id}/link")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error generating link: {str(e)}"
            )

@router.post("/offers/{offer_id}/signature")
async def request_signature(
    offer_id: int,
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to request an e-signature for an offer.
    """
    body = await request.json()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{LINK_SERVICE_URL}/offers/{offer_id}/signature",
                json=body
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error requesting signature: {str(e)}"
            )

@router.get("/signature/{signature_id}/status")
async def get_signature_status(
    signature_id: str, 
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to check the status of a signature request.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{LINK_SERVICE_URL}/signature/{signature_id}/status")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error checking signature status: {str(e)}"
            )