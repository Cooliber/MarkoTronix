"""
PDF Attachment Processor

This module provides functionality for processing PDF attachments,
including text extraction, OCR, and metadata extraction.
"""

import os
import re
import tempfile
from typing import Dict, List, Optional, Any, Tuple
import asyncio
from pathlib import Path

from .base import AttachmentProcessor, AttachmentProcessingResult

# Import optional dependencies - these will be checked at runtime
try:
    import pytesseract
    from pdf2image import convert_from_path
    import PyPDF2
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    DEPENDENCIES_AVAILABLE = False


class PDFProcessor(AttachmentProcessor):
    """Processor for PDF attachments."""
    
    def __init__(self, ocr_enabled: bool = True, language: str = 'eng'):
        """
        Initialize the PDF processor.
        
        Args:
            ocr_enabled: Whether to use OCR for text extraction
            language: Language for OCR (default: English)
        """
        super().__init__()
        self.ocr_enabled = ocr_enabled
        self.language = language
        
        # Check if dependencies are available
        if not DEPENDENCIES_AVAILABLE:
            raise ImportError(
                "PDF processing dependencies not available. "
                "Please install pytesseract, pdf2image, and PyPDF2."
            )
    
    @staticmethod
    def can_process(file_path: str) -> bool:
        """Check if this processor can handle the given file."""
        _, ext = os.path.splitext(file_path)
        return ext.lower() in ['.pdf']
    
    @staticmethod
    def get_mime_types() -> List[str]:
        """Get the MIME types this processor can handle."""
        return ['application/pdf']
    
    async def process(self, file_path: str) -> AttachmentProcessingResult:
        """Process a PDF attachment."""
        result = AttachmentProcessingResult()
        
        try:
            # Extract text and metadata using PyPDF2
            text, metadata = await self._extract_text_and_metadata(file_path)
            
            # If text extraction failed or returned very little text and OCR is enabled,
            # try OCR
            if self.ocr_enabled and (not text or len(text.strip()) < 100):
                ocr_text = await self._perform_ocr(file_path)
                if ocr_text:
                    text = ocr_text
            
            # Extract entities from the text
            entities = await self._extract_entities(text)
            
            # Determine tags based on content
            tags = await self._determine_tags(text, entities)
            
            # Set result fields
            result.success = True
            result.text_content = text
            result.metadata = metadata
            result.entities = entities
            result.tags = tags
            result.confidence = 0.8 if text else 0.3
            
            return result
            
        except Exception as e:
            result.success = False
            result.error_message = f"Error processing PDF: {str(e)}"
            return result
    
    async def _extract_text_and_metadata(self, file_path: str) -> Tuple[str, Dict[str, Any]]:
        """
        Extract text and metadata from a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Tuple[str, Dict[str, Any]]: Extracted text and metadata
        """
        # Use PyPDF2 to extract text and metadata
        text = ""
        metadata = {}
        
        # Run in a thread to avoid blocking the event loop
        def extract():
            nonlocal text, metadata
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                
                # Extract metadata
                if reader.metadata:
                    for key, value in reader.metadata.items():
                        if key.startswith('/'):
                            key = key[1:]
                        metadata[key] = value
                
                # Extract text from each page
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text += page.extract_text() + "\n"
            
            return text, metadata
        
        # Run in a thread pool
        return await asyncio.to_thread(extract)
    
    async def _perform_ocr(self, file_path: str) -> str:
        """
        Perform OCR on a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            str: Extracted text
        """
        # Run in a thread to avoid blocking the event loop
        def ocr():
            # Convert PDF to images
            images = convert_from_path(file_path)
            
            # Perform OCR on each image
            text = ""
            for image in images:
                # Create a temporary file for the image
                with tempfile.NamedTemporaryFile(suffix='.png') as temp:
                    image.save(temp.name)
                    # Perform OCR
                    page_text = pytesseract.image_to_string(temp.name, lang=self.language)
                    text += page_text + "\n"
            
            return text
        
        # Run in a thread pool
        return await asyncio.to_thread(ocr)
    
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
    
    async def _determine_tags(self, text: str, entities: Dict[str, Any]) -> List[str]:
        """
        Determine tags based on content.
        
        Args:
            text: Extracted text
            entities: Extracted entities
            
        Returns:
            List[str]: Tags
        """
        tags = []
        
        # Check for invoice
        if any(keyword in text.lower() for keyword in ['invoice', 'faktura', 'rachunek']):
            tags.append('invoice')
        
        # Check for contract
        if any(keyword in text.lower() for keyword in ['contract', 'agreement', 'umowa']):
            tags.append('contract')
        
        # Check for report
        if any(keyword in text.lower() for keyword in ['report', 'raport', 'sprawozdanie']):
            tags.append('report')
        
        # Check for offer
        if any(keyword in text.lower() for keyword in ['offer', 'proposal', 'oferta']):
            tags.append('offer')
        
        # Check for HVAC-specific content
        if any(keyword in text.lower() for keyword in ['hvac', 'heating', 'ventilation', 'air conditioning', 'klimatyzacja', 'ogrzewanie', 'wentylacja']):
            tags.append('hvac')
        
        return tags