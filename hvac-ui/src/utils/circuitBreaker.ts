/**
 * Circuit Breaker implementation for frontend API calls
 * 
 * This pattern prevents cascading failures by failing fast when a service
 * is unavailable, giving it time to recover.
 */

import { logger } from './logger';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation, requests pass through
  OPEN = 'open',         // Circuit is open, requests fail fast
  HALF_OPEN = 'half_open', // Testing if service is back online
}

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  name: string;
  fallback?: <T>(error: Error) => Promise<T> | T;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private readonly name: string;
  private readonly fallback?: <T>(error: Error) => Promise<T> | T;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.recoveryTimeout = options.recoveryTimeout;
    this.name = options.name;
    this.fallback = options.fallback;

    logger.info(`Circuit breaker '${this.name}' initialized`);
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if recovery timeout has elapsed
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        logger.info(`Circuit breaker '${this.name}' transitioning from OPEN to HALF_OPEN`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        logger.warn(`Circuit breaker '${this.name}' is OPEN - failing fast`);
        
        // If a fallback is provided, use it
        if (this.fallback) {
          return this.fallback(new CircuitBreakerError(`Circuit breaker '${this.name}' is open`));
        }
        
        throw new CircuitBreakerError(`Circuit breaker '${this.name}' is open`);
      }
    }

    try {
      // Execute the function
      const result = await fn();

      // If the call succeeded and we were in HALF_OPEN, reset the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        logger.info(`Circuit breaker '${this.name}' recovered, transitioning to CLOSED`);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      // Record the failure
      this.failureCount++;
      this.lastFailureTime = Date.now();

      logger.warn(
        `Circuit breaker '${this.name}' recorded failure ${this.failureCount}/${this.failureThreshold}: ${error}`
      );

      // If we've reached the threshold, open the circuit
      if (this.state === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
        logger.error(`Circuit breaker '${this.name}' transitioning to OPEN`);
        this.state = CircuitState.OPEN;
      }

      // If a fallback is provided, use it
      if (this.fallback) {
        return this.fallback(error as Error);
      }

      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Reset the circuit breaker to its initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    logger.info(`Circuit breaker '${this.name}' has been reset`);
  }

  /**
   * Get the current state of the circuit breaker
   */
  getState(): any {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
    };
  }
}

// Registry of circuit breakers for monitoring
const circuitBreakers: Record<string, CircuitBreaker> = {};

/**
 * Get a circuit breaker by name
 */
export function getCircuitBreaker(name: string): CircuitBreaker | undefined {
  return circuitBreakers[name];
}

/**
 * Create and register a new circuit breaker
 */
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  const cb = new CircuitBreaker(options);
  circuitBreakers[options.name] = cb;
  return cb;
}

/**
 * Get all circuit breakers
 */
export function getAllCircuitBreakers(): Record<string, CircuitBreaker> {
  return { ...circuitBreakers };
}
