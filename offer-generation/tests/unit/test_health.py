"""
Unit tests for the health check implementation.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock

from app.core.health import (
    HealthStatus,
    ComponentHealth,
    ServiceHealth,
    CircuitBreakerHealth,
    HealthCheck,
    check_database_health,
    check_redis_health,
    check_openai_health,
    check_storage_health,
    check_external_service,
    check_circuit_breakers,
    determine_overall_status,
)


class TestHealthModels:
    """Tests for the health check models."""

    def test_component_health(self):
        """Test ComponentHealth model."""
        health = ComponentHealth(
            status=HealthStatus.OK,
            message="All good",
            last_checked=datetime.now(),
            response_time_ms=100,
        )
        assert health.status == HealthStatus.OK
        assert health.message == "All good"
        assert isinstance(health.last_checked, datetime)
        assert health.response_time_ms == 100

    def test_service_health(self):
        """Test ServiceHealth model."""
        health = ServiceHealth(
            name="test-service",
            status=HealthStatus.DEGRADED,
            message="Slow response",
            last_checked=datetime.now(),
            response_time_ms=500,
        )
        assert health.name == "test-service"
        assert health.status == HealthStatus.DEGRADED
        assert health.message == "Slow response"
        assert isinstance(health.last_checked, datetime)
        assert health.response_time_ms == 500

    def test_circuit_breaker_health(self):
        """Test CircuitBreakerHealth model."""
        health = CircuitBreakerHealth(
            name="test-breaker",
            state="open",
            failure_count=5,
            last_failure_time=datetime.now(),
            failure_threshold=3,
            recovery_timeout=60.0,
        )
        assert health.name == "test-breaker"
        assert health.state == "open"
        assert health.failure_count == 5
        assert isinstance(health.last_failure_time, datetime)
        assert health.failure_threshold == 3
        assert health.recovery_timeout == 60.0

    def test_health_check(self):
        """Test HealthCheck model."""
        database = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=50,
        )
        redis = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=20,
        )
        openai = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=150,
        )
        storage = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=30,
        )
        
        health = HealthCheck(
            status=HealthStatus.OK,
            timestamp=datetime.now(),
            version="1.0.0",
            uptime_seconds=3600,
            database=database,
            redis=redis,
            openai=openai,
            storage=storage,
            external_services=[],
            circuit_breakers=[],
            request_id="test-request-id",
        )
        
        assert health.status == HealthStatus.OK
        assert isinstance(health.timestamp, datetime)
        assert health.version == "1.0.0"
        assert health.uptime_seconds == 3600
        assert health.database == database
        assert health.redis == redis
        assert health.openai == openai
        assert health.storage == storage
        assert health.external_services == []
        assert health.circuit_breakers == []
        assert health.request_id == "test-request-id"


class TestHealthChecks:
    """Tests for the health check functions."""

    @pytest.mark.asyncio
    @patch("app.core.health.asyncio.sleep")
    async def test_check_database_health_success(self, mock_sleep):
        """Test successful database health check."""
        # Mock successful database connection
        mock_sleep.return_value = None
        
        result = await check_database_health()
        assert result.status == HealthStatus.OK
        assert "successful" in result.message
        assert isinstance(result.last_checked, datetime)
        assert isinstance(result.response_time_ms, int)

    @pytest.mark.asyncio
    @patch("app.core.health.asyncio.sleep")
    async def test_check_redis_health_success(self, mock_sleep):
        """Test successful Redis health check."""
        # Mock successful Redis connection
        mock_sleep.return_value = None
        
        result = await check_redis_health()
        assert result.status == HealthStatus.OK
        assert "successful" in result.message
        assert isinstance(result.last_checked, datetime)
        assert isinstance(result.response_time_ms, int)

    @pytest.mark.asyncio
    @patch("app.core.health.asyncio.sleep")
    async def test_check_openai_health_success(self, mock_sleep):
        """Test successful OpenAI health check."""
        # Mock successful OpenAI connection
        mock_sleep.return_value = None
        
        result = await check_openai_health()
        assert result.status == HealthStatus.OK
        assert "successful" in result.message
        assert isinstance(result.last_checked, datetime)
        assert isinstance(result.response_time_ms, int)

    @pytest.mark.asyncio
    @patch("app.core.health.asyncio.sleep")
    async def test_check_storage_health_success(self, mock_sleep):
        """Test successful storage health check."""
        # Mock successful storage check
        mock_sleep.return_value = None
        
        result = await check_storage_health()
        assert result.status == HealthStatus.OK
        assert "accessible" in result.message
        assert isinstance(result.last_checked, datetime)
        assert isinstance(result.response_time_ms, int)

    @pytest.mark.asyncio
    @patch("httpx.AsyncClient.get")
    async def test_check_external_service_success(self, mock_get):
        """Test successful external service health check."""
        # Mock successful HTTP response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        service = {"name": "test-service", "url": "http://test-service/health"}
        result = await check_external_service(service)
        
        assert result.name == "test-service"
        assert result.status == HealthStatus.OK
        assert "available" in result.message
        assert isinstance(result.last_checked, datetime)
        assert isinstance(result.response_time_ms, int)

    @pytest.mark.asyncio
    @patch("httpx.AsyncClient.get")
    async def test_check_external_service_failure(self, mock_get):
        """Test failed external service health check."""
        # Mock failed HTTP response
        mock_get.side_effect = Exception("Connection refused")
        
        service = {"name": "test-service", "url": "http://test-service/health"}
        result = await check_external_service(service)
        
        assert result.name == "test-service"
        assert result.status == HealthStatus.DEGRADED
        assert "unavailable" in result.message
        assert isinstance(result.last_checked, datetime)
        assert isinstance(result.response_time_ms, int)

    @patch("app.core.health.get_all_circuit_breakers")
    def test_check_circuit_breakers(self, mock_get_all_circuit_breakers):
        """Test circuit breaker health check."""
        # Mock circuit breakers
        mock_cb = MagicMock()
        mock_cb.get_state.return_value = {
            "name": "test-breaker",
            "state": "closed",
            "failure_count": 0,
            "last_failure_time": 0,
            "failure_threshold": 5,
            "recovery_timeout": 60.0,
        }
        
        mock_get_all_circuit_breakers.return_value = {"test-breaker": mock_cb}
        
        result = check_circuit_breakers()
        
        assert len(result) == 1
        assert result[0].name == "test-breaker"
        assert result[0].state == "closed"
        assert result[0].failure_count == 0
        assert result[0].last_failure_time is None
        assert result[0].failure_threshold == 5
        assert result[0].recovery_timeout == 60.0

    def test_determine_overall_status_all_ok(self):
        """Test determining overall status when all components are OK."""
        database = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=50,
        )
        redis = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=20,
        )
        openai = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=150,
        )
        storage = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=30,
        )
        
        result = determine_overall_status(
            database=database,
            redis=redis,
            openai=openai,
            storage=storage,
            external_services=[],
            circuit_breakers=[],
        )
        
        assert result == HealthStatus.OK

    def test_determine_overall_status_database_critical(self):
        """Test determining overall status when database is critical."""
        database = ComponentHealth(
            status=HealthStatus.CRITICAL,
            message="Connection failed",
            last_checked=datetime.now(),
            response_time_ms=None,
        )
        redis = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=20,
        )
        openai = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=150,
        )
        storage = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=30,
        )
        
        result = determine_overall_status(
            database=database,
            redis=redis,
            openai=openai,
            storage=storage,
            external_services=[],
            circuit_breakers=[],
        )
        
        assert result == HealthStatus.CRITICAL

    def test_determine_overall_status_storage_critical(self):
        """Test determining overall status when storage is critical."""
        database = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=50,
        )
        redis = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=20,
        )
        openai = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=150,
        )
        storage = ComponentHealth(
            status=HealthStatus.CRITICAL,
            message="Not accessible",
            last_checked=datetime.now(),
            response_time_ms=None,
        )
        
        result = determine_overall_status(
            database=database,
            redis=redis,
            openai=openai,
            storage=storage,
            external_services=[],
            circuit_breakers=[],
        )
        
        assert result == HealthStatus.CRITICAL

    def test_determine_overall_status_openai_degraded(self):
        """Test determining overall status when OpenAI is degraded."""
        database = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=50,
        )
        redis = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=20,
        )
        openai = ComponentHealth(
            status=HealthStatus.DEGRADED,
            message="Slow response",
            last_checked=datetime.now(),
            response_time_ms=500,
        )
        storage = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=30,
        )
        
        result = determine_overall_status(
            database=database,
            redis=redis,
            openai=openai,
            storage=storage,
            external_services=[],
            circuit_breakers=[],
        )
        
        assert result == HealthStatus.DEGRADED

    def test_determine_overall_status_multiple_degraded(self):
        """Test determining overall status when multiple components are degraded."""
        database = ComponentHealth(
            status=HealthStatus.DEGRADED,
            message="Slow response",
            last_checked=datetime.now(),
            response_time_ms=500,
        )
        redis = ComponentHealth(
            status=HealthStatus.DEGRADED,
            message="Slow response",
            last_checked=datetime.now(),
            response_time_ms=500,
        )
        openai = ComponentHealth(
            status=HealthStatus.DEGRADED,
            message="Slow response",
            last_checked=datetime.now(),
            response_time_ms=500,
        )
        storage = ComponentHealth(
            status=HealthStatus.OK,
            message="Connected",
            last_checked=datetime.now(),
            response_time_ms=30,
        )
        
        # Create a degraded external service
        external_service = ServiceHealth(
            name="test-service",
            status=HealthStatus.DEGRADED,
            message="Slow response",
            last_checked=datetime.now(),
            response_time_ms=500,
        )
        
        # Create an open circuit breaker
        circuit_breaker = CircuitBreakerHealth(
            name="test-breaker",
            state="open",
            failure_count=5,
            last_failure_time=datetime.now(),
            failure_threshold=3,
            recovery_timeout=60.0,
        )
        
        result = determine_overall_status(
            database=database,
            redis=redis,
            openai=openai,
            storage=storage,
            external_services=[external_service],
            circuit_breakers=[circuit_breaker],
        )
        
        # More than 50% of components are degraded, so should be critical
        assert result == HealthStatus.CRITICAL