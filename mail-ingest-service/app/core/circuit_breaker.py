"""
Circuit Breaker implementation for the mail-ingest service.

This module provides:
1. A circuit breaker pattern implementation to prevent cascading failures
2. Automatic tracking of failures and recovery
3. Configurable thresholds and timeouts
4. Integration with the logging system
5. Prometheus metrics for monitoring
"""

import asyncio
import time
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Type, TypeVar, Union, cast

import prometheus_client as prom
from core.exceptions import CircuitBreakerOpenException
from core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

# Type variables for function signatures
T = TypeVar("T")
F = TypeVar("F", bound=Callable[..., Any])

# Prometheus metrics
CIRCUIT_STATE = prom.Enum(
    "circuit_breaker_state",
    "Current state of the circuit breaker",
    ["name"],
    states=["closed", "open", "half_open"],
)

CIRCUIT_FAILURES = prom.Counter(
    "circuit_breaker_failures_total",
    "Total number of failures detected by circuit breakers",
    ["name"],
)

CIRCUIT_SUCCESSES = prom.Counter(
    "circuit_breaker_successes_total",
    "Total number of successful calls through circuit breakers",
    ["name"],
)

CIRCUIT_REJECTED = prom.Counter(
    "circuit_breaker_rejected_total",
    "Total number of rejected calls due to open circuit breakers",
    ["name"],
)

CIRCUIT_LATENCY = prom.Histogram(
    "circuit_breaker_call_duration_seconds",
    "Duration of calls through circuit breakers",
    ["name", "status"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0),
)


class CircuitState(str, Enum):
    """Possible states of a circuit breaker."""
    
    CLOSED = "closed"  # Normal operation, requests pass through
    OPEN = "open"  # Circuit is open, requests fail fast
    HALF_OPEN = "half_open"  # Testing if service is back online


class CircuitBreaker:
    """
    Implementation of the Circuit Breaker pattern.
    
    The circuit breaker monitors for failures in service calls. After a threshold
    of failures is reached, the circuit "opens" and fails fast without making the
    actual service call, giving the service time to recover.
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        expected_exceptions: Optional[Set[Type[Exception]]] = None,
        fallback: Optional[Callable[..., Any]] = None,
    ):
        """
        Initialize a new circuit breaker.
        
        Args:
            name: Name of the circuit breaker for identification
            failure_threshold: Number of failures before opening the circuit
            recovery_timeout: Seconds to wait before trying again (half-open state)
            expected_exceptions: Set of exceptions that count as failures
            fallback: Optional function to call when the circuit is open
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exceptions = expected_exceptions or {Exception}
        self.fallback = fallback
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.last_success_time = 0.0
        
        # Initialize Prometheus metric
        CIRCUIT_STATE.labels(name=name).state(self.state)
        
        logger.info(
            f"Circuit breaker '{name}' initialized",
            extra={
                "failure_threshold": failure_threshold,
                "recovery_timeout": recovery_timeout,
            },
        )
    
    def get_state(self) -> Dict[str, Any]:
        """Get the current state of the circuit breaker."""
        return {
            "name": self.name,
            "state": self.state,
            "failure_count": self.failure_count,
            "last_failure_time": self.last_failure_time,
            "last_success_time": self.last_success_time,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout,
        }
    
    def reset(self) -> None:
        """Reset the circuit breaker to its initial state."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        
        # Update Prometheus metric
        CIRCUIT_STATE.labels(name=self.name).state(self.state)
        
        logger.info(f"Circuit breaker '{self.name}' has been reset")
    
    def _handle_success(self) -> None:
        """Handle a successful call."""
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            
            # Update Prometheus metric
            CIRCUIT_STATE.labels(name=self.name).state(self.state)
            
            logger.info(f"Circuit breaker '{self.name}' closing after successful test")
        
        self.last_success_time = time.time()
        
        # Increment success counter
        CIRCUIT_SUCCESSES.labels(name=self.name).inc()
    
    def _handle_failure(self, exception: Exception) -> None:
        """Handle a failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        # Increment failure counter
        CIRCUIT_FAILURES.labels(name=self.name).inc()
        
        if self.state == CircuitState.CLOSED and self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            
            # Update Prometheus metric
            CIRCUIT_STATE.labels(name=self.name).state(self.state)
            
            logger.warning(
                f"Circuit breaker '{self.name}' opened after {self.failure_count} failures",
                extra={"exception": str(exception)},
            )
    
    def _should_allow_request(self) -> bool:
        """Determine if a request should be allowed through."""
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                
                # Update Prometheus metric
                CIRCUIT_STATE.labels(name=self.name).state(self.state)
                
                logger.info(f"Circuit breaker '{self.name}' transitioning to half-open state")
                return True
            
            # Increment rejected counter
            CIRCUIT_REJECTED.labels(name=self.name).inc()
            
            return False
        
        # In HALF_OPEN state, allow one test request
        return True
    
    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """
        Call a function with circuit breaker protection.
        
        Args:
            func: The function to call
            *args: Positional arguments to pass to the function
            **kwargs: Keyword arguments to pass to the function
            
        Returns:
            The result of the function call
            
        Raises:
            CircuitBreakerOpenException: If the circuit is open
            Exception: Any exception raised by the function
        """
        if not self._should_allow_request():
            logger.warning(f"Circuit breaker '{self.name}' is open - failing fast")
            
            if self.fallback:
                return await self.fallback(*args, **kwargs)
            
            raise CircuitBreakerOpenException(f"Circuit breaker '{self.name}' is open")
        
        start_time = time.time()
        status = "success"
        
        try:
            # Call the function
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # Handle success
            self._handle_success()
            return result
        
        except Exception as e:
            status = "failure"
            
            # Check if this is an expected exception type
            is_expected = any(isinstance(e, exc_type) for exc_type in self.expected_exceptions)
            
            if is_expected:
                # Handle failure
                self._handle_failure(e)
                
                # If we have a fallback and the circuit is now open, use it
                if self.state == CircuitState.OPEN and self.fallback:
                    return await self.fallback(*args, **kwargs)
            
            # Re-raise the exception
            raise
        
        finally:
            # Record latency
            duration = time.time() - start_time
            CIRCUIT_LATENCY.labels(name=self.name, status=status).observe(duration)


# Registry of circuit breakers
_circuit_breakers: Dict[str, CircuitBreaker] = {}


def create_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 60.0,
    expected_exceptions: Optional[Set[Type[Exception]]] = None,
    fallback: Optional[Callable[..., Any]] = None,
) -> CircuitBreaker:
    """
    Create and register a new circuit breaker.
    
    Args:
        name: Name of the circuit breaker
        failure_threshold: Number of failures before opening the circuit
        recovery_timeout: Seconds to wait before trying again
        expected_exceptions: Set of exceptions that count as failures
        fallback: Optional function to call when the circuit is open
        
    Returns:
        The created circuit breaker
    """
    cb = CircuitBreaker(
        name=name,
        failure_threshold=failure_threshold,
        recovery_timeout=recovery_timeout,
        expected_exceptions=expected_exceptions,
        fallback=fallback,
    )
    
    _circuit_breakers[name] = cb
    return cb


def get_circuit_breaker(name: str) -> Optional[CircuitBreaker]:
    """Get a circuit breaker by name."""
    return _circuit_breakers.get(name)


def get_all_circuit_breakers() -> Dict[str, CircuitBreaker]:
    """Get all registered circuit breakers."""
    return _circuit_breakers.copy()


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 60.0,
    expected_exceptions: Optional[Set[Type[Exception]]] = None,
    fallback: Optional[Callable[..., Any]] = None,
) -> Callable[[F], F]:
    """
    Decorator to apply circuit breaker pattern to a function.
    
    Args:
        name: Name of the circuit breaker
        failure_threshold: Number of failures before opening the circuit
        recovery_timeout: Seconds to wait before trying again
        expected_exceptions: Set of exceptions that count as failures
        fallback: Optional function to call when the circuit is open
        
    Returns:
        Decorated function with circuit breaker protection
    """
    
    def decorator(func: F) -> F:
        # Create or get the circuit breaker
        cb = get_circuit_breaker(name) or create_circuit_breaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            expected_exceptions=expected_exceptions,
            fallback=fallback,
        )
        
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            return await cb.call(func, *args, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            return asyncio.run(cb.call(func, *args, **kwargs))
        
        # Use the appropriate wrapper based on whether the function is async
        if asyncio.iscoroutinefunction(func):
            return cast(F, async_wrapper)
        else:
            return cast(F, sync_wrapper)
    
    return decorator