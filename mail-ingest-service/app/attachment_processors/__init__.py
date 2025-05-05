"""
Attachment Processors Package

This package contains processors for different types of email attachments.
Each processor is responsible for handling a specific type of attachment
and extracting relevant information from it.
"""

from .base import AttachmentProcessor, AttachmentProcessingResult
from .pdf_processor import PDFProcessor
from .image_processor import ImageProcessor
from .excel_processor import ExcelProcessor
from .word_processor import WordProcessor
from .factory import get_processor_for_attachment

__all__ = [
    'AttachmentProcessor',
    'AttachmentProcessingResult',
    'PDFProcessor',
    'ImageProcessor',
    'ExcelProcessor',
    'WordProcessor',
    'get_processor_for_attachment',
]