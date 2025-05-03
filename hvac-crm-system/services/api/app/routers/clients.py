from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.client import Client, Installation
from app.schemas.client import (
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    InstallationCreate,
    InstallationResponse,
    InstallationUpdate,
)

router = APIRouter()

@router.post("/", response_model=ClientResponse)
async def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new client.
    """
    client = Client(
        **client_in.dict(exclude_unset=True),
        created_by_id=current_user.id,
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return client

@router.get("/", response_model=List[ClientResponse])
async def read_clients(
    skip: int = 0,
    limit: int = 100,
    district: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve clients with optional filtering.
    """
    query = db.query(Client)
    
    if district:
        query = query.filter(Client.district == district)
    
    if search:
        query = query.filter(
            Client.name.ilike(f"%{search}%") |
            Client.email.ilike(f"%{search}%") |
            Client.phone.ilike(f"%{search}%") |
            Client.address.ilike(f"%{search}%")
        )
    
    clients = query.offset(skip).limit(limit).all()
    
    return clients

@router.get("/{client_id}", response_model=ClientResponse)
async def read_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific client by ID.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    return client

@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a client.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    update_data = client_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(client, field, value)
    
    db.commit()
    db.refresh(client)
    
    return client

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a client.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    db.delete(client)
    db.commit()
    
    return None

# Installation endpoints

@router.post("/{client_id}/installations", response_model=InstallationResponse)
async def create_installation(
    client_id: str,
    installation_in: InstallationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new installation for a client.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    installation = Installation(
        **installation_in.dict(exclude_unset=True),
        client_id=client_id,
    )
    
    db.add(installation)
    db.commit()
    db.refresh(installation)
    
    return installation

@router.get("/{client_id}/installations", response_model=List[InstallationResponse])
async def read_installations(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all installations for a client.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    installations = db.query(Installation).filter(Installation.client_id == client_id).all()
    
    return installations

@router.get("/{client_id}/installations/{installation_id}", response_model=InstallationResponse)
async def read_installation(
    client_id: str,
    installation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific installation.
    """
    installation = db.query(Installation).filter(
        Installation.id == installation_id,
        Installation.client_id == client_id
    ).first()
    
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )
    
    return installation

@router.put("/{client_id}/installations/{installation_id}", response_model=InstallationResponse)
async def update_installation(
    client_id: str,
    installation_id: str,
    installation_in: InstallationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an installation.
    """
    installation = db.query(Installation).filter(
        Installation.id == installation_id,
        Installation.client_id == client_id
    ).first()
    
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )
    
    update_data = installation_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(installation, field, value)
    
    db.commit()
    db.refresh(installation)
    
    return installation

@router.delete("/{client_id}/installations/{installation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_installation(
    client_id: str,
    installation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an installation.
    """
    installation = db.query(Installation).filter(
        Installation.id == installation_id,
        Installation.client_id == client_id
    ).first()
    
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )
    
    db.delete(installation)
    db.commit()
    
    return None