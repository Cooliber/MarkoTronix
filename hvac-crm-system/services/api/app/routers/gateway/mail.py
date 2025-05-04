from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Any, Dict, List, Optional
from ...core.security import get_current_user
from ...models.user import User

router = APIRouter(prefix="/mail", tags=["mail"])

MAIL_SERVICE_URL = os.getenv("MAIL_SERVICE_URL", "http://mail-ingest:8000")

@router.get("/emails")
async def get_emails(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Proxy endpoint to get all emails from the mail ingest service.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAIL_SERVICE_URL}/emails",
                params={"skip": skip, "limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error fetching emails: {str(e)}"
            )

@router.get("/emails/{email_id}")
async def get_email(
    email_id: int, 
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to get a specific email from the mail ingest service.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{MAIL_SERVICE_URL}/emails/{email_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error fetching email: {str(e)}"
            )

@router.get("/emails/{email_id}/attachments")
async def get_email_attachments(
    email_id: int, 
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Proxy endpoint to get attachments for a specific email.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{MAIL_SERVICE_URL}/emails/{email_id}/attachments")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error fetching email attachments: {str(e)}"
            )

@router.post("/manual/fetch")
async def manual_fetch(
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Proxy endpoint to manually trigger email fetching.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{MAIL_SERVICE_URL}/manual/fetch")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error triggering email fetch: {str(e)}"
            )

@router.post("/emails/{email_id}/reprocess")
async def reprocess_email(
    email_id: int, 
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Proxy endpoint to reprocess an email.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{MAIL_SERVICE_URL}/emails/{email_id}/reprocess")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error reprocessing email: {str(e)}"
            )

@router.post("/webhook/email")
async def webhook_email(
    request: Request
) -> Dict[str, Any]:
    """
    Proxy endpoint for the email webhook.
    """
    body = await request.body()
    headers = dict(request.headers)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{MAIL_SERVICE_URL}/webhook/email",
                content=body,
                headers={k: v for k, v in headers.items() if k.lower() not in ["host", "content-length"]}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=e.response.status_code if hasattr(e, "response") else 500,
                detail=f"Error forwarding webhook: {str(e)}"
            )