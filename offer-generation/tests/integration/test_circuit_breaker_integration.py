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

    @patch("main.call_openai_api")
    def test_openai_circuit_breaker(self, mock_openai, client):
        """Test the OpenAI circuit breaker."""
        # Set up the mock to fail
        mock_openai.side_effect = Exception("OpenAI API error")
        
        # Reset the circuit breaker
        from app.core.circuit_breaker import get_circuit_breaker
        cb = get_circuit_breaker("openai")
        if cb:
            cb.reset()
        
        # Make multiple requests to trigger the circuit breaker
        for i in range(5):  # Assuming failure_threshold is 3
            try:
                # Call the function directly since we can't easily test through the API
                from main import call_llm_api
                import asyncio
                asyncio.run(call_llm_api("test prompt", use_openrouter=False))
            except Exception:
                pass
        
        # Check that the circuit breaker is open
        cb = get_circuit_breaker("openai")
        assert cb is not None
        assert cb.state == "open"
        
        # Try one more time, should get CircuitBreakerOpenException
        with pytest.raises(CircuitBreakerOpenException):
            asyncio.run(call_llm_api("test prompt", use_openrouter=False))

    @patch("main.call_openrouter_api")
    def test_openrouter_circuit_breaker(self, mock_openrouter, client):
        """Test the OpenRouter circuit breaker."""
        # Set up the mock to fail
        mock_openrouter.side_effect = Exception("OpenRouter API error")
        
        # Reset the circuit breaker
        from app.core.circuit_breaker import get_circuit_breaker
        cb = get_circuit_breaker("openrouter")
        if cb:
            cb.reset()
        
        # Make multiple requests to trigger the circuit breaker
        for i in range(5):  # Assuming failure_threshold is 3
            try:
                # Call the function directly since we can't easily test through the API
                from main import call_llm_api
                import asyncio
                asyncio.run(call_llm_api("test prompt", use_openrouter=True))
            except Exception:
                pass
        
        # Check that the circuit breaker is open
        cb = get_circuit_breaker("openrouter")
        assert cb is not None
        assert cb.state == "open"
        
        # Try one more time, should get CircuitBreakerOpenException
        with pytest.raises(CircuitBreakerOpenException):
            asyncio.run(call_llm_api("test prompt", use_openrouter=True))

    def test_offer_generation_with_circuit_breaker(self, client):
        """Test offer generation with circuit breaker."""
        # Reset the circuit breaker
        from app.core.circuit_breaker import get_circuit_breaker
        cb = get_circuit_breaker("openai")
        if cb:
            cb.reset()
        
        # Mock the call_llm_api function to fail
        with patch("main.call_llm_api") as mock_llm:
            mock_llm.side_effect = Exception("LLM API error")
            
            # Create a test offer
            offer_data = {
                "client_name": "Test Client",
                "client_email": "test@example.com",
                "client_phone": "123456789",
                "client_address": "Test Address",
                "service_type": "HVAC Installation",
                "description": "Test description",
                "price": 1000.0,
                "currency": "PLN",
                "valid_days": 30
            }
            
            # Make the request
            response = client.post("/offers", json=offer_data)
            
            # Should return an error
            assert response.status_code == 422
            assert "Failed to create offer" in response.json()["message"]