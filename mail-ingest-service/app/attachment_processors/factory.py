"""
Attachment Processor Factory

This module provides a factory function for selecting the appropriate
attachment processor based on file type.
"""

import os
import mimetypes
from typing import Optional, List, Type

from .base import AttachmentProcessor
from .pdf_processor import PDFProcessor
from .image_processor import ImageProcessor
from .excel_processor import ExcelProcessor
from .word_processor import WordProcessor


# Register all available processors
AVAILABLE_PROCESSORS: List[Type[AttachmentProcessor]] = [
    PDFProcessor,
    ImageProcessor,
    ExcelProcessor,
    WordProcessor,
]


def get_processor_for_attachment(file_path: str, mime_type: Optional[str] = None) -> Optional[AttachmentProcessor]:
    """
    Get the appropriate processor for an attachment.
    
    Args:
        file_path: Path to the attachment file
        mime_type: MIME type of the attachment (optional)
        
    Returns:
        AttachmentProcessor: Appropriate processor for the attachment, or None if no processor is available
    """
    # If mime_type is not provided, try to guess it
    if mime_type is None:
        mime_type, _ = mimetypes.guess_type(file_path)
    
    # Try to find a processor based on file extension
    for processor_class in AVAILABLE_PROCESSORS:
        try:
            if processor_class.can_process(file_path):
                return processor_class()
        except ImportError:
            # Skip processors with missing dependencies
            continue
    
    # If no processor was found based on extension, try MIME type
    if mime_type:
        for processor_class in AVAILABLE_PROCESSORS:
            try:
                if mime_type in processor_class.get_mime_types():
                    return processor_class()
            except ImportError:
                # Skip processors with missing dependencies
                continue
    
    # No suitable processor found
    return None