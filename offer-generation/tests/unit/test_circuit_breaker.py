"""
Unit tests for the circuit breaker implementation.
"""

import asyncio
import pytest
import time
from unittest.mock import AsyncMock, patch

from app.core.circuit_breaker import (
    CircuitBreaker,
    CircuitState,
    create_circuit_breaker,
    circuit_breaker,
    get_circuit_breaker,
    get_all_circuit_breakers,
)
from app.core.exceptions import CircuitBreakerOpenException


class TestCircuitBreaker:
    """Tests for the CircuitBreaker class."""

    def test_init(self):
        """Test initialization of circuit breaker."""
        cb = CircuitBreaker(name="test")
        assert cb.name == "test"
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0
        assert cb.failure_threshold == 5
        assert cb.recovery_timeout == 60.0

    def test_get_state(self):
        """Test getting the state of a circuit breaker."""
        cb = CircuitBreaker(name="test")
        state = cb.get_state()
        assert state["name"] == "test"
        assert state["state"] == CircuitState.CLOSED
        assert state["failure_count"] == 0
        assert state["failure_threshold"] == 5
        assert state["recovery_timeout"] == 60.0

    def test_reset(self):
        """Test resetting a circuit breaker."""
        cb = CircuitBreaker(name="test")
        cb.state = CircuitState.OPEN
        cb.failure_count = 10
        cb.reset()
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0

    @pytest.mark.asyncio
    async def test_successful_call(self):
        """Test a successful call through the circuit breaker."""
        cb = CircuitBreaker(name="test")
        mock_func = AsyncMock(return_value="success")
        result = await cb.call(mock_func, "arg1", kwarg1="kwarg1")
        assert result == "success"
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0
        mock_func.assert_called_once_with("arg1", kwarg1="kwarg1")

    @pytest.mark.asyncio
    async def test_failed_call(self):
        """Test a failed call through the circuit breaker."""
        cb = CircuitBreaker(name="test", failure_threshold=2)
        mock_func = AsyncMock(side_effect=ValueError("test error"))
        
        # First failure
        with pytest.raises(ValueError):
            await cb.call(mock_func)
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 1
        
        # Second failure - should open the circuit
        with pytest.raises(ValueError):
            await cb.call(mock_func)
        assert cb.state == CircuitState.OPEN
        assert cb.failure_count == 2
        
        # Third call - circuit is open, should fail fast
        with pytest.raises(CircuitBreakerOpenException):
            await cb.call(mock_func)

    @pytest.mark.asyncio
    async def test_half_open_state(self):
        """Test transition to half-open state after recovery timeout."""
        cb = CircuitBreaker(name="test", failure_threshold=1, recovery_timeout=0.1)
        mock_func = AsyncMock(side_effect=ValueError("test error"))
        
        # Fail and open the circuit
        with pytest.raises(ValueError):
            await cb.call(mock_func)
        assert cb.state == CircuitState.OPEN
        
        # Wait for recovery timeout
        time.sleep(0.2)
        
        # Next call should put circuit in half-open state
        mock_func = AsyncMock(return_value="success")
        result = await cb.call(mock_func)
        assert result == "success"
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0

    @pytest.mark.asyncio
    async def test_fallback(self):
        """Test fallback function when circuit is open."""
        fallback = AsyncMock(return_value="fallback")
        cb = CircuitBreaker(name="test", failure_threshold=1, fallback=fallback)
        mock_func = AsyncMock(side_effect=ValueError("test error"))
        
        # Fail and open the circuit
        with pytest.raises(ValueError):
            await cb.call(mock_func, "arg1")
        assert cb.state == CircuitState.OPEN
        
        # Next call should use fallback
        result = await cb.call(mock_func, "arg1")
        assert result == "fallback"
        fallback.assert_called_once_with("arg1")


class TestCircuitBreakerRegistry:
    """Tests for the circuit breaker registry functions."""

    def test_create_and_get_circuit_breaker(self):
        """Test creating and retrieving a circuit breaker."""
        cb = create_circuit_breaker(name="test_registry")
        assert cb.name == "test_registry"
        
        retrieved_cb = get_circuit_breaker("test_registry")
        assert retrieved_cb is cb
        
        all_cbs = get_all_circuit_breakers()
        assert "test_registry" in all_cbs
        assert all_cbs["test_registry"] is cb

    def test_get_nonexistent_circuit_breaker(self):
        """Test getting a circuit breaker that doesn't exist."""
        cb = get_circuit_breaker("nonexistent")
        assert cb is None


class TestCircuitBreakerDecorator:
    """Tests for the circuit_breaker decorator."""

    @pytest.mark.asyncio
    async def test_decorator_async(self):
        """Test the circuit_breaker decorator on an async function."""
        @circuit_breaker(name="test_decorator_async", failure_threshold=1)
        async def test_func(arg1, kwarg1=None):
            if arg1 == "fail":
                raise ValueError("test error")
            return f"success: {arg1}, {kwarg1}"
        
        # Successful call
        result = await test_func("test", kwarg1="test")
        assert result == "success: test, test"
        
        # Failed call
        with pytest.raises(ValueError):
            await test_func("fail")
        
        # Circuit should be open now
        with pytest.raises(CircuitBreakerOpenException):
            await test_func("test")

    def test_decorator_sync(self):
        """Test the circuit_breaker decorator on a sync function."""
        @circuit_breaker(name="test_decorator_sync", failure_threshold=1)
        def test_func(arg1, kwarg1=None):
            if arg1 == "fail":
                raise ValueError("test error")
            return f"success: {arg1}, {kwarg1}"
        
        # Successful call
        result = test_func("test", kwarg1="test")
        assert result == "success: test, test"
        
        # Failed call
        with pytest.raises(ValueError):
            test_func("fail")
        
        # Circuit should be open now
        with pytest.raises(CircuitBreakerOpenException):
            test_func("test")