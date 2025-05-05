"""
Integration tests for the health check endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Import the FastAPI app
from main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestHealthEndpoints:
    """Tests for the health check endpoints."""

    def test_health_endpoint(self, client):
        """Test the /health endpoint."""
        # Mock the health check functions to avoid actual external calls
        with patch("app.core.health.check_database_health") as mock_db, \
             patch("app.core.health.check_redis_health") as mock_redis, \
             patch("app.core.health.check_openai_health") as mock_openai, \
             patch("app.core.health.check_storage_health") as mock_storage, \
             patch("app.core.health.check_external_service") as mock_ext, \
             patch("app.core.health.check_circuit_breakers") as mock_cb:
            
            # Set up mock returns
            from app.core.health import HealthStatus, ComponentHealth, CircuitBreakerHealth
            from datetime import datetime
            
            mock_db.return_value = ComponentHealth(
                status=HealthStatus.OK,
                message="Connected",
                last_checked=datetime.now(),
                response_time_ms=50,
            )
            
            mock_redis.return_value = ComponentHealth(
                status=HealthStatus.OK,
                message="Connected",
                last_checked=datetime.now(),
                response_time_ms=20,
            )
            
            mock_openai.return_value = ComponentHealth(
                status=HealthStatus.OK,
                message="Connected",
                last_checked=datetime.now(),
                response_time_ms=150,
            )
            
            mock_storage.return_value = ComponentHealth(
                status=HealthStatus.OK,
                message="Connected",
                last_checked=datetime.now(),
                response_time_ms=30,
            )
            
            mock_ext.return_value = []
            
            mock_cb.return_value = [
                CircuitBreakerHealth(
                    name="test-breaker",
                    state="closed",
                    failure_count=0,
                    last_failure_time=None,
                    failure_threshold=5,
                    recovery_timeout=60.0,
                )
            ]
            
            # Make the request
            response = client.get("/health")
            
            # Check the response
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert "timestamp" in data
            assert "version" in data
            assert "uptime_seconds" in data
            assert "database" in data
            assert "redis" in data
            assert "openai" in data
            assert "storage" in data
            assert "circuit_breakers" in data
            assert len(data["circuit_breakers"]) == 1
            assert data["circuit_breakers"][0]["name"] == "test-breaker"

    def test_metrics_endpoint(self, client):
        """Test the /metrics endpoint."""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]
        
        # Check for some expected metrics
        metrics_text = response.text
        assert "offer_generation_offers_created_total" in metrics_text
        assert "offer_generation_offers_rendered_total" in metrics_text
        assert "offer_generation_pdf_generation_duration_seconds" in metrics_text
        assert "offer_generation_template_rendering_duration_seconds" in metrics_text
        assert "offer_generation_openai_call_duration_seconds" in metrics_text
        assert "circuit_breaker_state" in metrics_text