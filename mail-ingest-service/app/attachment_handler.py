"""
Attachment Handler

This module provides functionality for handling email attachments,
including processing, storage, and metadata extraction.
"""

import os
import asyncio
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
import mimetypes

from app.core.logging import get_logger
from app.core.exceptions import AttachmentProcessingException
from app.core.circuit_breaker import circuit_breaker
from app.attachment_processors import get_processor_for_attachment, AttachmentProcessingResult

# Initialize logger
logger = get_logger(__name__)


class AttachmentHandler:
    """Handler for email attachments."""
    
    def __init__(self, attachments_dir: Path, supabase_client=None):
        """
        Initialize the attachment handler.
        
        Args:
            attachments_dir: Directory for storing attachments
            supabase_client: Supabase client for storage (optional)
        """
        self.attachments_dir = attachments_dir
        self.supabase_client = supabase_client
    
    async def process_attachment(
        self, 
        file_path: str, 
        content_type: Optional[str] = None,
        email_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Process an attachment file.
        
        Args:
            file_path: Path to the attachment file
            content_type: MIME type of the attachment (optional)
            email_id: ID of the email the attachment belongs to (optional)
            
        Returns:
            Dict[str, Any]: Processing results
        """
        try:
            # Ensure the file exists
            if not os.path.exists(file_path):
                raise AttachmentProcessingException(f"Attachment file not found: {file_path}")
            
            # Get the appropriate processor
            processor = get_processor_for_attachment(file_path, content_type)
            
            if processor:
                # Process the attachment
                logger.info(f"Processing attachment {file_path} with {processor.__class__.__name__}")
                result = await processor.process(file_path)
                
                # Upload to Supabase if configured and processing was successful
                supabase_info = None
                if self.supabase_client and result.success:
                    try:
                        supabase_info = await self._upload_to_supabase(file_path)
                    except Exception as e:
                        logger.warning(f"Supabase upload failed, using local path: {str(e)}")
                
                # Prepare result
                processing_result = {
                    'success': result.success,
                    'file_path': file_path,
                    'content_type': content_type or mimetypes.guess_type(file_path)[0],
                    'email_id': email_id,
                    'text_content': result.text_content,
                    'metadata': result.metadata,
                    'entities': result.entities,
                    'tags': result.tags,
                    'confidence': result.confidence,
                }
                
                # Add Supabase info if available
                if supabase_info:
                    processing_result['supabase_path'] = supabase_info.get('storage_path')
                    processing_result['public_url'] = supabase_info.get('public_url')
                
                return processing_result
            else:
                # No processor available
                logger.warning(f"No processor available for attachment: {file_path}")
                return {
                    'success': False,
                    'file_path': file_path,
                    'content_type': content_type or mimetypes.guess_type(file_path)[0],
                    'email_id': email_id,
                    'error_message': 'No processor available for this file type',
                }
        except Exception as e:
            logger.error(f"Error processing attachment {file_path}: {str(e)}")
            return {
                'success': False,
                'file_path': file_path,
                'content_type': content_type or mimetypes.guess_type(file_path)[0],
                'email_id': email_id,
                'error_message': str(e),
            }
    
    @circuit_breaker(
        name="supabase",
        failure_threshold=3,
        recovery_timeout=60.0,
        expected_exceptions={Exception},
    )
    async def _upload_to_supabase(self, file_path: str, bucket_name: str = "email-attachments") -> Dict[str, Any]:
        """
        Upload a file to Supabase Storage.
        
        Args:
            file_path: Path to the file to upload
            bucket_name: Name of the Supabase Storage bucket
            
        Returns:
            Dict[str, Any]: Upload result
        """
        if not self.supabase_client:
            logger.warning("Supabase not configured. Skipping upload.")
            return None
        
        try:
            # Read file content
            with open(file_path, "rb") as f:
                file_content = f.read()
            
            # Create a unique path in the bucket
            import uuid
            storage_path = f"{uuid.uuid4()}/{Path(file_path).name}"
            
            # Upload to Supabase
            response = self.supabase_client.storage.from_(bucket_name).upload(
                storage_path,
                file_content
            )
            
            # Get public URL
            public_url = self.supabase_client.storage.from_(bucket_name).get_public_url(storage_path)
            
            return {
                "storage_path": storage_path,
                "public_url": public_url
            }
        except Exception as e:
            logger.error(f"Error uploading to Supabase: {str(e)}")
            raise AttachmentProcessingException(f"Failed to upload to Supabase: {str(e)}")
    
    async def save_attachment(self, email_id: int, filename: str, content: bytes) -> str:
        """
        Save an attachment to disk.
        
        Args:
            email_id: ID of the email the attachment belongs to
            filename: Name of the attachment file
            content: Content of the attachment
            
        Returns:
            str: Path to the saved file
        """
        try:
            # Create directory for email attachments
            attachment_dir = self.attachments_dir / str(email_id)
            attachment_dir.mkdir(exist_ok=True, parents=True)
            
            # Save attachment
            file_path = attachment_dir / filename
            with open(file_path, 'wb') as f:
                f.write(content)
            
            return str(file_path)
        except Exception as e:
            logger.error(f"Error saving attachment: {str(e)}")
            raise AttachmentProcessingException(f"Failed to save attachment: {str(e)}")
    
    async def process_email_attachments(self, email_id: int, attachments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process all attachments for an email.
        
        Args:
            email_id: ID of the email
            attachments: List of attachment information
            
        Returns:
            List[Dict[str, Any]]: Processing results for all attachments
        """
        results = []
        
        for attachment in attachments:
            file_path = attachment.get('file_path')
            content_type = attachment.get('content_type')
            
            if file_path:
                # Process the attachment
                result = await self.process_attachment(file_path, content_type, email_id)
                results.append(result)
        
        return results