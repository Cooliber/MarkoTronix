"""
Image Attachment Processor

This module provides functionality for processing image attachments,
including OCR and image analysis.
"""

import os
import re
import asyncio
from typing import Dict, List, Any
from pathlib import Path

from .base import AttachmentProcessor, AttachmentProcessingResult

# Import optional dependencies - these will be checked at runtime
try:
    import pytesseract
    from PIL import Image, ExifTags
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    DEPENDENCIES_AVAILABLE = False


class ImageProcessor(AttachmentProcessor):
    """Processor for image attachments."""
    
    def __init__(self, language: str = 'eng'):
        """
        Initialize the image processor.
        
        Args:
            language: Language for OCR (default: English)
        """
        super().__init__()
        self.language = language
        
        # Check if dependencies are available
        if not DEPENDENCIES_AVAILABLE:
            raise ImportError(
                "Image processing dependencies not available. "
                "Please install pytesseract and Pillow."
            )
    
    @staticmethod
    def can_process(file_path: str) -> bool:
        """Check if this processor can handle the given file."""
        _, ext = os.path.splitext(file_path)
        return ext.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif']
    
    @staticmethod
    def get_mime_types() -> List[str]:
        """Get the MIME types this processor can handle."""
        return [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/bmp',
            'image/tiff'
        ]
    
    async def process(self, file_path: str) -> AttachmentProcessingResult:
        """Process an image attachment."""
        result = AttachmentProcessingResult()
        
        try:
            # Extract text using OCR
            text = await self._perform_ocr(file_path)
            
            # Extract metadata from image
            metadata = await self._extract_metadata(file_path)
            
            # Extract entities from the text
            entities = await self._extract_entities(text)
            
            # Determine tags based on content
            tags = await self._determine_tags(text, entities, metadata)
            
            # Set result fields
            result.success = True
            result.text_content = text
            result.metadata = metadata
            result.entities = entities
            result.tags = tags
            result.confidence = 0.7 if text else 0.3
            
            return result
            
        except Exception as e:
            result.success = False
            result.error_message = f"Error processing image: {str(e)}"
            return result
    
    async def _perform_ocr(self, file_path: str) -> str:
        """
        Perform OCR on an image file.
        
        Args:
            file_path: Path to the image file
            
        Returns:
            str: Extracted text
        """
        # Run in a thread to avoid blocking the event loop
        def ocr():
            # Perform OCR
            return pytesseract.image_to_string(file_path, lang=self.language)
        
        # Run in a thread pool
        return await asyncio.to_thread(ocr)
    
    async def _extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from an image file.
        
        Args:
            file_path: Path to the image file
            
        Returns:
            Dict[str, Any]: Extracted metadata
        """
        # Run in a thread to avoid blocking the event loop
        def extract():
            metadata = {}
            
            try:
                with Image.open(file_path) as img:
                    # Basic image properties
                    metadata['format'] = img.format
                    metadata['mode'] = img.mode
                    metadata['size'] = img.size
                    
                    # Extract EXIF data if available
                    if hasattr(img, '_getexif') and img._getexif():
                        exif = {
                            ExifTags.TAGS.get(tag, tag): value
                            for tag, value in img._getexif().items()
                            if tag in ExifTags.TAGS
                        }
                        
                        # Add relevant EXIF data to metadata
                        for key in ['DateTimeOriginal', 'Make', 'Model', 'GPSInfo']:
                            if key in exif:
                                metadata[key] = exif[key]
            except Exception as e:
                metadata['error'] = str(e)
            
            return metadata
        
        # Run in a thread pool
        return await asyncio.to_thread(extract)
    
    async def _extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract entities from text.
        
        Args:
            text: Text to extract entities from
            
        Returns:
            Dict[str, Any]: Extracted entities
        """
        entities = {}
        
        # Extract invoice-related entities
        if any(keyword in text.lower() for keyword in ['invoice', 'faktura', 'rachunek']):
            # Extract invoice number
            invoice_number_match = re.search(r'(?:invoice|faktura|rachunek)[^\d]*(\d+[-/\w]*)', text.lower())
            if invoice_number_match:
                entities['invoice_number'] = invoice_number_match.group(1)
            
            # Extract amount
            amount_match = re.search(r'(?:amount|kwota|suma)[^\d]*(\d+[.,]\d+)', text.lower())
            if amount_match:
                entities['amount'] = amount_match.group(1)
            
            # Extract date
            date_match = re.search(r'(?:date|data)[^\d]*(\d{1,2}[-./]\d{1,2}[-./]\d{2,4})', text.lower())
            if date_match:
                entities['date'] = date_match.group(1)
        
        # Extract contact information
        email_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        if email_matches:
            entities['emails'] = email_matches
        
        phone_matches = re.findall(r'(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{3,4}', text)
        if phone_matches:
            entities['phones'] = phone_matches
        
        return entities
    
    async def _determine_tags(self, text: str, entities: Dict[str, Any], metadata: Dict[str, Any]) -> List[str]:
        """
        Determine tags based on content.
        
        Args:
            text: Extracted text
            entities: Extracted entities
            metadata: Image metadata
            
        Returns:
            List[str]: Tags
        """
        tags = []
        
        # Check for document type
        if any(keyword in text.lower() for keyword in ['invoice', 'faktura', 'rachunek']):
            tags.append('invoice')
        
        if any(keyword in text.lower() for keyword in ['contract', 'agreement', 'umowa']):
            tags.append('contract')
        
        if any(keyword in text.lower() for keyword in ['report', 'raport', 'sprawozdanie']):
            tags.append('report')
        
        if any(keyword in text.lower() for keyword in ['offer', 'proposal', 'oferta']):
            tags.append('offer')
        
        # Check for HVAC-specific content
        if any(keyword in text.lower() for keyword in ['hvac', 'heating', 'ventilation', 'air conditioning', 'klimatyzacja', 'ogrzewanie', 'wentylacja']):
            tags.append('hvac')
        
        # Check if it's a photo (based on EXIF data)
        if 'DateTimeOriginal' in metadata or 'Make' in metadata:
            tags.append('photo')
        
        return tags