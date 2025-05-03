from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.offer import Offer
from app.models.service import Service
from app.models.communication import Email

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get dashboard statistics.
    """
    # Get today's date
    today = datetime.now().date()
    
    # Count new emails
    new_emails_count = db.query(func.count(Email.id)).filter(
        Email.status == "unread",
        Email.is_outgoing == False,
        func.date(Email.created_at) == today
    ).scalar()
    
    # Count today's services
    today_services_count = db.query(func.count(Service.id)).filter(
        func.date(Service.scheduled_date) == today
    ).scalar()
    
    # Count offers in progress
    offers_in_progress_count = db.query(func.count(Offer.id)).filter(
        Offer.status.in_(["draft", "sent", "viewed"])
    ).scalar()
    
    # Calculate revenue (from accepted offers in the last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    
    revenue = db.query(func.sum(Offer.packages.price)).filter(
        Offer.status == "accepted",
        Offer.accepted_at >= thirty_days_ago
    ).scalar() or 0
    
    # Get recent clients
    recent_clients = db.query(Client).order_by(Client.created_at.desc()).limit(5).all()
    
    # Get upcoming services
    upcoming_services = db.query(Service).filter(
        Service.scheduled_date >= today,
        Service.status.in_(["scheduled", "in_progress"])
    ).order_by(Service.scheduled_date).limit(5).all()
    
    return {
        "new_emails_count": new_emails_count,
        "today_services_count": today_services_count,
        "offers_in_progress_count": offers_in_progress_count,
        "revenue_last_30_days": revenue,
        "recent_clients": [
            {
                "id": client.id,
                "name": client.name,
                "email": client.email,
                "created_at": client.created_at
            }
            for client in recent_clients
        ],
        "upcoming_services": [
            {
                "id": service.id,
                "client_id": service.client_id,
                "client_name": service.client.name,
                "service_type": service.service_type,
                "scheduled_date": service.scheduled_date,
                "status": service.status
            }
            for service in upcoming_services
        ]
    }