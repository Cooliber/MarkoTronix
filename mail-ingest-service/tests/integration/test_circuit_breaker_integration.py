"""
Integration tests for the circuit breaker integration with external services.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Import the FastAPI app
from main import app
from app.core.exceptions import CircuitBreakerOpenException


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestCircuitBreakerIntegration:
    """Tests for the circuit breaker integration with external services."""

    @patch("main.upload_to_supabase")
    def test_supabase_circuit_breaker(self, mock_upload, client):
        """Test the Supabase circuit breaker."""
        # Set up the mock to fail
        mock_upload.side_effect = Exception("Supabase connection error")
        
        # Create a test file
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".txt") as temp_file:
            temp_file.write(b"Test content")
            temp_file.flush()
            
            # Reset the circuit breaker
            from app.core.circuit_breaker import get_circuit_breaker
            cb = get_circuit_breaker("supabase")
            if cb:
                cb.reset()
            
            # Make multiple requests to trigger the circuit breaker
            for i in range(5):  # Assuming failure_threshold is 3
                try:
                    # Call the function directly since we can't easily test through the API
                    from main import upload_to_supabase
                    import asyncio
                    asyncio.run(upload_to_supabase(temp_file.name))
                except Exception:
                    pass
            
            # Check that the circuit breaker is open
            cb = get_circuit_breaker("supabase")
            assert cb is not None
            assert cb.state == "open"
            
            # Try one more time, should get CircuitBreakerOpenException
            with pytest.raises(CircuitBreakerOpenException):
                asyncio.run(upload_to_supabase(temp_file.name))

    @patch("main.MailBox")
    def test_imap_circuit_breaker(self, mock_mailbox, client):
        """Test the IMAP circuit breaker."""
        # Set up the mock to fail
        mock_instance = MagicMock()
        mock_instance.__enter__.side_effect = Exception("IMAP connection error")
        mock_mailbox.return_value = mock_instance
        
        # Reset the circuit breaker
        from app.core.circuit_breaker import get_circuit_breaker
        cb = get_circuit_breaker("imap")
        if cb:
            cb.reset()
        
        # Make multiple requests to trigger the circuit breaker
        for i in range(5):  # Assuming failure_threshold is 3
            try:
                # Call the function directly since we can't easily test through the API
                from main import fetch_emails
                import asyncio
                asyncio.run(fetch_emails())
            except Exception:
                pass
        
        # Check that the circuit breaker is open
        cb = get_circuit_breaker("imap")
        assert cb is not None
        assert cb.state == "open"
        
        # Try one more time, should get CircuitBreakerOpenException
        with pytest.raises(CircuitBreakerOpenException):
            asyncio.run(fetch_emails())

    def test_manual_fetch_endpoint(self, client):
        """Test the manual fetch endpoint with circuit breaker."""
        # Reset the circuit breaker
        from app.core.circuit_breaker import get_circuit_breaker
        cb = get_circuit_breaker("imap")
        if cb:
            cb.reset()
        
        # Mock the fetch_emails function to fail
        with patch("main.fetch_emails") as mock_fetch:
            mock_fetch.side_effect = Exception("IMAP connection error")
            
            # Make the request
            response = client.post("/manual/fetch")
            
            # Should still return 200 because it's a background task
            assert response.status_code == 200
            assert response.json()["status"] == "Email fetch triggered"