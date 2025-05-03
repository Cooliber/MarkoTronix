from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.communication import Transcription
from app.schemas.communication import TranscriptionCreate, TranscriptionResponse, TranscriptionUpdate

router = APIRouter()

@router.post("/", response_model=TranscriptionResponse)
async def create_transcription(
    transcription_in: TranscriptionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new transcription.
    """
    transcription = Transcription(
        **transcription_in.dict(exclude_unset=True),
        status="pending",
    )
    
    db.add(transcription)
    db.commit()
    db.refresh(transcription)
    
    # Add background task to process transcription
    from app.utils.transcription import process_transcription
    background_tasks.add_task(
        process_transcription,
        transcription_id=transcription.id,
    )
    
    return transcription

@router.post("/upload", response_model=TranscriptionResponse)
async def upload_audio_for_transcription(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    client_id: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload audio file and create a transcription.
    """
    # Save audio file to storage
    from app.utils.storage import save_file_to_storage
    audio_url = await save_file_to_storage(audio_file, "transcriptions")
    
    # Create transcription
    transcription = Transcription(
        title=title,
        audio_url=audio_url,
        client_id=client_id,
        status="pending",
    )
    
    db.add(transcription)
    db.commit()
    db.refresh(transcription)
    
    # Add background task to process transcription
    from app.utils.transcription import process_transcription
    background_tasks.add_task(
        process_transcription,
        transcription_id=transcription.id,
    )
    
    return transcription

@router.get("/", response_model=List[TranscriptionResponse])
async def read_transcriptions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    client_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve transcriptions with optional filtering.
    """
    query = db.query(Transcription)
    
    if status:
        query = query.filter(Transcription.status == status)
    
    if client_id:
        query = query.filter(Transcription.client_id == client_id)
    
    transcriptions = query.order_by(Transcription.created_at.desc()).offset(skip).limit(limit).all()
    
    return transcriptions

@router.get("/{transcription_id}", response_model=TranscriptionResponse)
async def read_transcription(
    transcription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific transcription by ID.
    """
    transcription = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    
    if not transcription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription not found",
        )
    
    return transcription

@router.put("/{transcription_id}", response_model=TranscriptionResponse)
async def update_transcription(
    transcription_id: str,
    transcription_in: TranscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a transcription.
    """
    transcription = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    
    if not transcription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription not found",
        )
    
    update_data = transcription_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(transcription, field, value)
    
    db.commit()
    db.refresh(transcription)
    
    return transcription

@router.delete("/{transcription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transcription(
    transcription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a transcription.
    """
    transcription = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    
    if not transcription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription not found",
        )
    
    db.delete(transcription)
    db.commit()
    
    return None

@router.post("/{transcription_id}/process", response_model=TranscriptionResponse)
async def manually_process_transcription(
    transcription_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger processing of a transcription.
    """
    transcription = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    
    if not transcription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription not found",
        )
    
    if transcription.status not in ["pending", "failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transcription is already in {transcription.status} status",
        )
    
    transcription.status = "processing"
    db.commit()
    
    # Add background task to process transcription
    from app.utils.transcription import process_transcription
    background_tasks.add_task(
        process_transcription,
        transcription_id=transcription.id,
    )
    
    return transcription