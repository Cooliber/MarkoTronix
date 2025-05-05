"""
Feedback module for the mail ingest service.

This module provides functionality for handling feedback on processed attachments,
including storing feedback and using it to improve extraction accuracy.
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base

from app.core.logging import get_logger
from app.models import Base

# Initialize logger
logger = get_logger(__name__)


class AttachmentFeedback(Base):
    """Model for storing feedback on processed attachments."""
    
    __tablename__ = "attachment_feedback"

    id = Column(Integer, primary_key=True, index=True)
    attachment_id = Column(Integer, ForeignKey("attachments.id"))
    processed_attachment_id = Column(Integer, ForeignKey("processed_attachments.id"))
    corrected_entities = Column(JSON, nullable=True)
    corrected_tags = Column(JSON, nullable=True)
    missing_entities = Column(JSON, nullable=True)
    missing_tags = Column(JSON, nullable=True)
    feedback_notes = Column(Text, nullable=True)
    rating = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class FeedbackService:
    """Service for handling feedback on processed attachments."""
    
    def __init__(self, db: Session):
        """Initialize the feedback service."""
        self.db = db
    
    def create_feedback(self, feedback_data: Dict[str, Any]) -> AttachmentFeedback:
        """
        Create a new feedback record.
        
        Args:
            feedback_data: Feedback data
            
        Returns:
            AttachmentFeedback: Created feedback record
        """
        feedback = AttachmentFeedback(
            attachment_id=feedback_data.get("attachmentId"),
            processed_attachment_id=feedback_data.get("processedAttachmentId"),
            corrected_entities=feedback_data.get("correctedEntities"),
            corrected_tags=feedback_data.get("correctedTags"),
            missing_entities=feedback_data.get("missingEntities"),
            missing_tags=feedback_data.get("missingTags"),
            feedback_notes=feedback_data.get("feedbackNotes"),
            rating=feedback_data.get("rating", 3)
        )
        
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        
        # Apply feedback to improve extraction accuracy
        self._apply_feedback(feedback)
        
        return feedback
    
    def get_feedback(self, feedback_id: int) -> Optional[AttachmentFeedback]:
        """
        Get a feedback record by ID.
        
        Args:
            feedback_id: Feedback ID
            
        Returns:
            AttachmentFeedback: Feedback record
        """
        return self.db.query(AttachmentFeedback).filter(AttachmentFeedback.id == feedback_id).first()
    
    def get_feedback_by_attachment(self, attachment_id: int) -> List[AttachmentFeedback]:
        """
        Get all feedback records for an attachment.
        
        Args:
            attachment_id: Attachment ID
            
        Returns:
            List[AttachmentFeedback]: List of feedback records
        """
        return self.db.query(AttachmentFeedback).filter(AttachmentFeedback.attachment_id == attachment_id).all()
    
    def _apply_feedback(self, feedback: AttachmentFeedback) -> None:
        """
        Apply feedback to improve extraction accuracy.
        
        This method updates the processed attachment with corrected data
        and stores the feedback for future training.
        
        Args:
            feedback: Feedback record
        """
        from app.models import ProcessedAttachment
        
        # Get the processed attachment
        processed_attachment = self.db.query(ProcessedAttachment).filter(
            ProcessedAttachment.id == feedback.processed_attachment_id
        ).first()
        
        if not processed_attachment:
            logger.warning(f"Processed attachment {feedback.processed_attachment_id} not found")
            return
        
        # Update entities with corrected values
        if feedback.corrected_entities:
            entities = processed_attachment.entities or {}
            for key, value in feedback.corrected_entities.items():
                entities[key] = value
            processed_attachment.entities = entities
        
        # Update tags with corrected values
        if feedback.corrected_tags:
            processed_attachment.tags = feedback.corrected_tags
        
        # Add missing entities
        if feedback.missing_entities:
            entities = processed_attachment.entities or {}
            for key, value in feedback.missing_entities.items():
                if key not in entities:
                    entities[key] = value
            processed_attachment.entities = entities
        
        # Add missing tags
        if feedback.missing_tags:
            tags = processed_attachment.tags or []
            for tag in feedback.missing_tags:
                if tag not in tags:
                    tags.append(tag)
            processed_attachment.tags = tags
        
        # Commit changes
        self.db.commit()
        
        logger.info(f"Applied feedback {feedback.id} to processed attachment {feedback.processed_attachment_id}")
        
        # TODO: Store feedback for future training of extraction models