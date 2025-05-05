"""
Base Attachment Processor

This module defines the base class for all attachment processors.
"""

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from pathlib import Path


@dataclass
class AttachmentProcessingResult:
    """Result of processing an attachment."""
    
    # Success or failure
    success: bool = False
    
    # Error message if processing failed
    error_message: Optional[str] = None
    
    # Extracted text content
    text_content: Optional[str] = None
    
    # Extracted metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Extracted entities (key-value pairs)
    entities: Dict[str, Any] = field(default_factory=dict)
    
    # Categorization tags
    tags: List[str] = field(default_factory=list)
    
    # Confidence score for extraction (0.0 to 1.0)
    confidence: float = 0.0
    
    # Path to processed file (if saved separately)
    processed_file_path: Optional[str] = None


class AttachmentProcessor(ABC):
    """Base class for attachment processors."""
    
    def __init__(self):
        """Initialize the processor."""
        pass
    
    @abstractmethod
    async def process(self, file_path: str) -> AttachmentProcessingResult:
        """
        Process an attachment file.
        
        Args:
            file_path: Path to the attachment file
            
        Returns:
            AttachmentProcessingResult: Result of processing
        """
        pass
    
    @staticmethod
    def can_process(file_path: str) -> bool:
        """
        Check if this processor can handle the given file.
        
        Args:
            file_path: Path to the attachment file
            
        Returns:
            bool: True if this processor can handle the file, False otherwise
        """
        # Default implementation checks file extension
        _, ext = os.path.splitext(file_path)
        return ext.lower() in []  # Empty list by default, subclasses should override
    
    @staticmethod
    def get_mime_types() -> List[str]:
        """
        Get the MIME types this processor can handle.
        
        Returns:
            List[str]: List of MIME types
        """
        return []  # Empty list by default, subclasses should override