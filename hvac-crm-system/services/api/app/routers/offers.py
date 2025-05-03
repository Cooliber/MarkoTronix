from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.offer import Offer, OfferPackage
from app.schemas.offer import (
    OfferCreate,
    OfferResponse,
    OfferUpdate,
    OfferPackageCreate,
    OfferPackageResponse,
    OfferPackageUpdate,
    OfferWithPackagesResponse,
)

router = APIRouter()

@router.post("/", response_model=OfferResponse)
async def create_offer(
    offer_in: OfferCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new offer.
    """
    offer = Offer(
        **offer_in.dict(exclude_unset=True, exclude={"packages"}),
        created_by_id=current_user.id,
        status="draft",
    )
    
    db.add(offer)
    db.commit()
    db.refresh(offer)
    
    # If source is transcription, generate offer packages using AI
    if offer.source == "transcription" and offer.transcription_id:
        from app.utils.ai import generate_offer_packages
        background_tasks.add_task(
            generate_offer_packages,
            offer_id=offer.id,
            transcription_id=offer.transcription_id,
        )
    
    # If packages are provided, create them
    if hasattr(offer_in, "packages") and offer_in.packages:
        for package_data in offer_in.packages:
            package = OfferPackage(
                **package_data.dict(),
                offer_id=offer.id,
            )
            db.add(package)
        
        db.commit()
    
    return offer

@router.get("/", response_model=List[OfferResponse])
async def read_offers(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    client_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve offers with optional filtering.
    """
    query = db.query(Offer)
    
    if status:
        query = query.filter(Offer.status == status)
    
    if client_id:
        query = query.filter(Offer.client_id == client_id)
    
    offers = query.order_by(Offer.created_at.desc()).offset(skip).limit(limit).all()
    
    return offers

@router.get("/{offer_id}", response_model=OfferWithPackagesResponse)
async def read_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific offer by ID, including its packages.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    
    return offer

@router.put("/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: str,
    offer_in: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an offer.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    
    update_data = offer_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(offer, field, value)
    
    db.commit()
    db.refresh(offer)
    
    return offer

@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an offer.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    
    db.delete(offer)
    db.commit()
    
    return None

@router.post("/{offer_id}/send", response_model=OfferResponse)
async def send_offer(
    offer_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send an offer to the client.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    
    if offer.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Offer is already in {offer.status} status",
        )
    
    # Check if offer has packages
    packages = db.query(OfferPackage).filter(OfferPackage.offer_id == offer_id).all()
    if not packages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offer has no packages",
        )
    
    # Update offer status
    offer.status = "sent"
    offer.sent_at = datetime.now()
    db.commit()
    db.refresh(offer)
    
    # Add background task to send offer email
    from app.utils.email import send_offer_email
    background_tasks.add_task(
        send_offer_email,
        offer_id=offer.id,
    )
    
    return offer

@router.post("/{offer_id}/packages", response_model=OfferPackageResponse)
async def create_offer_package(
    offer_id: str,
    package_in: OfferPackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new package for an offer.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    
    package = OfferPackage(
        **package_in.dict(),
        offer_id=offer_id,
    )
    
    db.add(package)
    db.commit()
    db.refresh(package)
    
    return package

@router.get("/{offer_id}/packages", response_model=List[OfferPackageResponse])
async def read_offer_packages(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all packages for an offer.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    
    packages = db.query(OfferPackage).filter(OfferPackage.offer_id == offer_id).all()
    
    return packages

@router.put("/{offer_id}/packages/{package_id}", response_model=OfferPackageResponse)
async def update_offer_package(
    offer_id: str,
    package_id: str,
    package_in: OfferPackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a package for an offer.
    """
    package = db.query(OfferPackage).filter(
        OfferPackage.id == package_id,
        OfferPackage.offer_id == offer_id
    ).first()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found",
        )
    
    update_data = package_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(package, field, value)
    
    db.commit()
    db.refresh(package)
    
    return package

@router.delete("/{offer_id}/packages/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer_package(
    offer_id: str,
    package_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a package from an offer.
    """
    package = db.query(OfferPackage).filter(
        OfferPackage.id == package_id,
        OfferPackage.offer_id == offer_id
    ).first()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found",
        )
    
    db.delete(package)
    db.commit()
    
    return None

@router.post("/{offer_id}/generate-packages", response_model=List[OfferPackageResponse])
async def generate_ai_packages(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI packages for an offer.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    
    # Generate packages using AI
    from app.utils.ai import generate_offer_packages_sync
    packages_data = generate_offer_packages_sync(offer_id=offer.id)
    
    # Delete existing packages
    db.query(OfferPackage).filter(OfferPackage.offer_id == offer_id).delete()
    
    # Create new packages
    packages = []
    for package_data in packages_data:
        package = OfferPackage(
            **package_data,
            offer_id=offer_id,
        )
        db.add(package)
        packages.append(package)
    
    db.commit()
    
    for package in packages:
        db.refresh(package)
    
    return packages