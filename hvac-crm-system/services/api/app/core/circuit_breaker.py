import functools
import logging
import time
import inspect
from typing import Any, Callable, Dict, Optional, TypeVar, cast, Awaitable, Union
from enum import Enum

logger = logging.getLogger(__name__)

T = TypeVar("T")

class CircuitState(str, Enum):
    CLOSED = "closed"  # Normal operation, requests pass through
    OPEN = "open"      # Circuit is open, requests fail fast
    HALF_OPEN = "half_open"  # Testing if service is back online


class CircuitBreaker:
    """
    Implementation of the Circuit Breaker pattern.

    This pattern prevents cascading failures by failing fast when a service
    is unavailable, giving it time to recover.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        expected_exceptions: tuple = (Exception,),
        name: Optional[str] = None,
    ):
        """
        Initialize a new circuit breaker.

        Args:
            failure_threshold: Number of consecutive failures before opening the circuit
            recovery_timeout: Time in seconds to wait before trying to recover
            expected_exceptions: Tuple of exceptions that count as failures
            name: Optional name for this circuit breaker
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exceptions = expected_exceptions
        self.name = name or "default"

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0

        logger.info(f"Circuit breaker '{self.name}' initialized")

    def __call__(self, func: Callable[..., Any]) -> Callable[..., Any]:
        """
        Decorator to wrap a function with circuit breaker functionality.
        Supports both synchronous and asynchronous functions.
        """
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            return await self.call(func, *args, **kwargs)

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            return self.call(func, *args, **kwargs)

        # Return appropriate wrapper based on whether the function is async
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """
        Call the function with circuit breaker protection.
        Supports both synchronous and asynchronous functions.
        """
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                logger.info(f"Circuit breaker '{self.name}' transitioning from OPEN to HALF_OPEN")
                self.state = CircuitState.HALF_OPEN
            else:
                logger.warning(f"Circuit breaker '{self.name}' is OPEN - failing fast")
                raise CircuitBreakerOpenError(f"Circuit breaker '{self.name}' is open")

        try:
            # Check if the function is a coroutine function (async)
            if inspect.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            # If the call succeeded and we were in HALF_OPEN, reset the circuit
            if self.state == CircuitState.HALF_OPEN:
                logger.info(f"Circuit breaker '{self.name}' recovered, transitioning to CLOSED")
                self.state = CircuitState.CLOSED
                self.failure_count = 0

            return result

        except self.expected_exceptions as e:
            # Record the failure
            self.failure_count += 1
            self.last_failure_time = time.time()

            logger.warning(
                f"Circuit breaker '{self.name}' recorded failure {self.failure_count}/{self.failure_threshold}: {str(e)}"
            )

            # If we've reached the threshold, open the circuit
            if self.state == CircuitState.CLOSED and self.failure_count >= self.failure_threshold:
                logger.error(f"Circuit breaker '{self.name}' transitioning to OPEN")
                self.state = CircuitState.OPEN

            # Re-raise the original exception
            raise

    def reset(self) -> None:
        """Reset the circuit breaker to its initial state."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        logger.info(f"Circuit breaker '{self.name}' has been reset")

    def get_state(self) -> Dict[str, Any]:
        """Get the current state of the circuit breaker."""
        return {
            "name": self.name,
            "state": self.state,
            "failure_count": self.failure_count,
            "last_failure_time": self.last_failure_time,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout,
        }


class CircuitBreakerOpenError(Exception):
    """Exception raised when a circuit breaker is open."""
    pass


# Create a registry of circuit breakers for monitoring
circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(name: str) -> Optional[CircuitBreaker]:
    """Get a circuit breaker by name."""
    return circuit_breakers.get(name)


def create_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 30.0,
    expected_exceptions: tuple = (Exception,),
) -> CircuitBreaker:
    """Create and register a new circuit breaker."""
    cb = CircuitBreaker(
        failure_threshold=failure_threshold,
        recovery_timeout=recovery_timeout,
        expected_exceptions=expected_exceptions,
        name=name,
    )
    circuit_breakers[name] = cb
    return cb
