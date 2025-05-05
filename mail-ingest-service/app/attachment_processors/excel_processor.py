"""
Excel Attachment Processor

This module provides functionality for processing Excel attachments,
including data extraction and analysis.
"""

import os
import re
import asyncio
import json
from typing import Dict, List, Any
from pathlib import Path

from .base import AttachmentProcessor, AttachmentProcessingResult

# Import optional dependencies - these will be checked at runtime
try:
    import pandas as pd
    import openpyxl
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    DEPENDENCIES_AVAILABLE = False


class ExcelProcessor(AttachmentProcessor):
    """Processor for Excel attachments."""
    
    def __init__(self):
        """Initialize the Excel processor."""
        super().__init__()
        
        # Check if dependencies are available
        if not DEPENDENCIES_AVAILABLE:
            raise ImportError(
                "Excel processing dependencies not available. "
                "Please install pandas and openpyxl."
            )
    
    @staticmethod
    def can_process(file_path: str) -> bool:
        """Check if this processor can handle the given file."""
        _, ext = os.path.splitext(file_path)
        return ext.lower() in ['.xlsx', '.xls', '.csv']
    
    @staticmethod
    def get_mime_types() -> List[str]:
        """Get the MIME types this processor can handle."""
        return [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ]
    
    async def process(self, file_path: str) -> AttachmentProcessingResult:
        """Process an Excel attachment."""
        result = AttachmentProcessingResult()
        
        try:
            # Extract data from Excel file
            data, metadata = await self._extract_data(file_path)
            
            # Convert data to text for full-text search
            text = await self._data_to_text(data)
            
            # Extract entities from the data
            entities = await self._extract_entities(data)
            
            # Determine tags based on content
            tags = await self._determine_tags(data, entities)
            
            # Set result fields
            result.success = True
            result.text_content = text
            result.metadata = metadata
            result.entities = entities
            result.tags = tags
            result.confidence = 0.9
            
            return result
            
        except Exception as e:
            result.success = False
            result.error_message = f"Error processing Excel file: {str(e)}"
            return result
    
    async def _extract_data(self, file_path: str) -> tuple:
        """
        Extract data from an Excel file.
        
        Args:
            file_path: Path to the Excel file
            
        Returns:
            tuple: (data, metadata)
        """
        # Run in a thread to avoid blocking the event loop
        def extract():
            _, ext = os.path.splitext(file_path)
            
            # Initialize metadata
            metadata = {
                'file_type': ext,
                'sheet_names': [],
                'row_count': 0,
                'column_count': 0
            }
            
            # Initialize data structure
            data = {
                'sheets': {}
            }
            
            # Process based on file type
            if ext.lower() == '.csv':
                # Read CSV file
                df = pd.read_csv(file_path)
                
                # Update metadata
                metadata['sheet_names'] = ['Sheet1']
                metadata['row_count'] = len(df)
                metadata['column_count'] = len(df.columns)
                
                # Store data
                data['sheets']['Sheet1'] = {
                    'headers': df.columns.tolist(),
                    'data': df.values.tolist()
                }
            else:
                # Read Excel file
                excel = pd.ExcelFile(file_path)
                metadata['sheet_names'] = excel.sheet_names
                
                # Process each sheet
                total_rows = 0
                max_columns = 0
                
                for sheet_name in excel.sheet_names:
                    df = pd.read_excel(excel, sheet_name)
                    
                    # Update counts
                    total_rows += len(df)
                    max_columns = max(max_columns, len(df.columns))
                    
                    # Store data
                    data['sheets'][sheet_name] = {
                        'headers': df.columns.tolist(),
                        'data': df.values.tolist()
                    }
                
                # Update metadata
                metadata['row_count'] = total_rows
                metadata['column_count'] = max_columns
                
                # Get workbook properties if possible
                try:
                    wb = openpyxl.load_workbook(file_path, read_only=True)
                    if wb.properties:
                        props = wb.properties
                        if props.title:
                            metadata['title'] = props.title
                        if props.creator:
                            metadata['creator'] = props.creator
                        if props.created:
                            metadata['created'] = props.created.isoformat()
                        if props.modified:
                            metadata['modified'] = props.modified.isoformat()
                except Exception:
                    # Ignore errors in getting properties
                    pass
            
            return data, metadata
        
        # Run in a thread pool
        return await asyncio.to_thread(extract)
    
    async def _data_to_text(self, data: Dict[str, Any]) -> str:
        """
        Convert Excel data to text for full-text search.
        
        Args:
            data: Extracted data
            
        Returns:
            str: Text representation of data
        """
        text_parts = []
        
        # Process each sheet
        for sheet_name, sheet_data in data['sheets'].items():
            text_parts.append(f"Sheet: {sheet_name}")
            
            # Add headers
            if sheet_data['headers']:
                text_parts.append("Headers: " + " | ".join(str(h) for h in sheet_data['headers']))
            
            # Add data rows (limit to first 100 rows for performance)
            for row_idx, row in enumerate(sheet_data['data'][:100]):
                text_parts.append("Row " + str(row_idx + 1) + ": " + " | ".join(str(cell) for cell in row))
        
        return "\n".join(text_parts)
    
    async def _extract_entities(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract entities from Excel data.
        
        Args:
            data: Extracted data
            
        Returns:
            Dict[str, Any]: Extracted entities
        """
        entities = {}
        
        # Look for common patterns in headers
        all_headers = []
        for sheet_data in data['sheets'].values():
            all_headers.extend([str(h).lower() for h in sheet_data['headers']])
        
        # Check for invoice data
        if any(h in all_headers for h in ['invoice', 'faktura', 'invoice number', 'nr faktury']):
            entities['document_type'] = 'invoice'
            
            # Try to find invoice numbers
            invoice_numbers = []
            for sheet_name, sheet_data in data['sheets'].items():
                headers = [str(h).lower() for h in sheet_data['headers']]
                
                # Find invoice number column
                invoice_col_idx = None
                for idx, header in enumerate(headers):
                    if header in ['invoice', 'faktura', 'invoice number', 'nr faktury', 'invoice no']:
                        invoice_col_idx = idx
                        break
                
                if invoice_col_idx is not None:
                    # Extract invoice numbers
                    for row in sheet_data['data']:
                        if len(row) > invoice_col_idx and row[invoice_col_idx]:
                            invoice_numbers.append(str(row[invoice_col_idx]))
            
            if invoice_numbers:
                entities['invoice_numbers'] = invoice_numbers
        
        # Check for client data
        if any(h in all_headers for h in ['client', 'customer', 'klient', 'name', 'company', 'firma']):
            # Try to find client names
            client_names = []
            for sheet_name, sheet_data in data['sheets'].items():
                headers = [str(h).lower() for h in sheet_data['headers']]
                
                # Find client name column
                client_col_idx = None
                for idx, header in enumerate(headers):
                    if header in ['client', 'customer', 'klient', 'name', 'company', 'firma']:
                        client_col_idx = idx
                        break
                
                if client_col_idx is not None:
                    # Extract client names
                    for row in sheet_data['data']:
                        if len(row) > client_col_idx and row[client_col_idx]:
                            client_names.append(str(row[client_col_idx]))
            
            if client_names:
                entities['client_names'] = client_names
        
        # Check for amount/price data
        if any(h in all_headers for h in ['amount', 'price', 'kwota', 'cena', 'value', 'wartość']):
            # Try to find amounts
            amounts = []
            for sheet_name, sheet_data in data['sheets'].items():
                headers = [str(h).lower() for h in sheet_data['headers']]
                
                # Find amount column
                amount_col_idx = None
                for idx, header in enumerate(headers):
                    if header in ['amount', 'price', 'kwota', 'cena', 'value', 'wartość', 'total', 'suma']:
                        amount_col_idx = idx
                        break
                
                if amount_col_idx is not None:
                    # Extract amounts
                    for row in sheet_data['data']:
                        if len(row) > amount_col_idx and row[amount_col_idx]:
                            try:
                                # Try to convert to float
                                amount = float(str(row[amount_col_idx]).replace(',', '.'))
                                amounts.append(amount)
                            except ValueError:
                                # If not a number, just add as string
                                amounts.append(str(row[amount_col_idx]))
            
            if amounts:
                entities['amounts'] = amounts
        
        return entities
    
    async def _determine_tags(self, data: Dict[str, Any], entities: Dict[str, Any]) -> List[str]:
        """
        Determine tags based on content.
        
        Args:
            data: Extracted data
            entities: Extracted entities
            
        Returns:
            List[str]: Tags
        """
        tags = []
        
        # Check for document type based on entities
        if 'document_type' in entities:
            tags.append(entities['document_type'])
        
        # Check for invoice data
        all_headers = []
        for sheet_data in data['sheets'].values():
            all_headers.extend([str(h).lower() for h in sheet_data['headers']])
        
        if any(h in all_headers for h in ['invoice', 'faktura', 'invoice number', 'nr faktury']):
            if 'invoice' not in tags:
                tags.append('invoice')
        
        # Check for price list
        if any(h in all_headers for h in ['price', 'cena', 'cost', 'koszt']):
            tags.append('price_list')
        
        # Check for inventory
        if any(h in all_headers for h in ['inventory', 'stock', 'zapasy', 'magazyn', 'quantity', 'ilość']):
            tags.append('inventory')
        
        # Check for client list
        if any(h in all_headers for h in ['client', 'customer', 'klient', 'contact', 'kontakt']):
            tags.append('client_list')
        
        # Check for HVAC-specific content
        hvac_keywords = ['hvac', 'heating', 'ventilation', 'air conditioning', 'klimatyzacja', 'ogrzewanie', 'wentylacja']
        for sheet_data in data['sheets'].values():
            for row in sheet_data['data']:
                row_text = ' '.join(str(cell) for cell in row).lower()
                if any(keyword in row_text for keyword in hvac_keywords):
                    tags.append('hvac')
                    break
        
        return tags