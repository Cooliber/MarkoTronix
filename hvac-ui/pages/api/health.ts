/**
 * Enhanced Health check API endpoint
 *
 * This endpoint provides comprehensive health information about the application:
 * - Basic application info (version, environment, uptime)
 * - Circuit breaker status for all registered circuit breakers
 * - Memory usage statistics
 * - External service connectivity status
 * - Build information
 *
 * It follows a standard format that can be consumed by monitoring tools.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getAllCircuitBreakers, CircuitState } from '../../src/utils/circuitBreaker';
import { logger } from '../../utils/logger';
import axios from 'axios';

// Health check status types
type HealthStatus = 'ok' | 'degraded' | 'critical';

// External service check result
interface ServiceCheck {
  name: string;
  status: 'ok' | 'error';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

// Complete health check response
interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  application: {
    name: string;
    version: string;
    environment: string;
    uptime: number;
    startTime: string;
  };
  system: {
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
      percentUsed: number;
    };
    loadAverage?: number[];
  };
  circuitBreakers: {
    [key: string]: {
      state: string;
      failureCount: number;
      lastFailureTime: number;
      failureThreshold: number;
      recoveryTimeout: number;
    };
  };
  services: ServiceCheck[];
  build?: {
    commitHash?: string;
    buildTime?: string;
    buildNumber?: string;
  };
  requestId?: string;
}

// List of external services to check
const EXTERNAL_SERVICES = [
  { name: 'api', url: process.env.NEXT_PUBLIC_API_URL || 'http://api:18000/api/health' },
  // Add other services as needed
];

/**
 * Check the health of an external service
 */
async function checkServiceHealth(service: { name: string; url: string }): Promise<ServiceCheck> {
  const startTime = Date.now();
  try {
    // Set a short timeout to avoid blocking the health check
    const response = await axios.get(service.url, { timeout: 2000 });
    const responseTime = Date.now() - startTime;

    return {
      name: service.name,
      status: response.status >= 200 && response.status < 300 ? 'ok' : 'error',
      responseTime,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: service.name,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Determine overall health status based on component statuses
 */
function determineOverallStatus(
  hasOpenCircuitBreakers: boolean,
  serviceChecks: ServiceCheck[]
): HealthStatus {
  // Count failed services
  const failedServices = serviceChecks.filter(s => s.status === 'error').length;
  const totalServices = serviceChecks.length;

  // Critical if more than 50% of services are down or all circuit breakers are open
  if (failedServices > totalServices / 2) {
    return 'critical';
  }

  // Degraded if any circuit breaker is open or any service is down
  if (hasOpenCircuitBreakers || failedServices > 0) {
    return 'degraded';
  }

  // Otherwise, we're good
  return 'ok';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  // Create a request-specific logger with a request ID
  const requestId = req.headers['x-request-id'] as string || logger.generateRequestId();
  const requestLogger = logger.forRequest(requestId);

  requestLogger.info('Health check requested', {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Set the request ID in the response headers
  res.setHeader('X-Request-ID', requestId);

  // Get the current timestamp
  const timestamp = new Date().toISOString();
  const startTime = new Date(Date.now() - (process.uptime() * 1000)).toISOString();

  // Get the environment
  const environment = process.env.NODE_ENV || 'development';

  // Get the application version
  const version = process.env.APP_VERSION || '1.0.0';

  // Get the uptime
  const uptime = process.uptime();

  // Get the memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsed = memoryUsage.heapUsed;
  const heapTotal = memoryUsage.heapTotal;
  const percentUsed = Math.round((heapUsed / heapTotal) * 100);

  // Get circuit breaker status
  let circuitBreakers = {};
  try {
    circuitBreakers = getAllCircuitBreakers();
  } catch (error) {
    requestLogger.error('Error getting circuit breaker status', { error });
  }

  // Check if any circuit breakers are open
  const hasOpenCircuitBreakers = Object.values(circuitBreakers).some(
    (cb) => cb.getState().state === CircuitState.OPEN
  );

  // Check external services in parallel
  const serviceChecks = await Promise.all(
    EXTERNAL_SERVICES.map(service => checkServiceHealth(service))
  );

  // Determine overall status
  const overallStatus = determineOverallStatus(hasOpenCircuitBreakers, serviceChecks);

  // Build information (if available)
  const buildInfo = {
    commitHash: process.env.COMMIT_HASH,
    buildTime: process.env.BUILD_TIME,
    buildNumber: process.env.BUILD_NUMBER
  };

  // Construct the full health check response
  const healthCheck: HealthCheckResponse = {
    status: overallStatus,
    timestamp,
    application: {
      name: 'hvac-ui',
      version,
      environment,
      uptime,
      startTime
    },
    system: {
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        percentUsed
      },
      // Load average is only available on Linux/macOS
      ...(typeof process.loadavg === 'function' ? { loadAverage: process.loadavg() } : {})
    },
    circuitBreakers: Object.fromEntries(
      Object.entries(circuitBreakers).map(([name, cb]) => [name, cb.getState()])
    ),
    services: serviceChecks,
    // Only include build info if we have it
    ...(Object.values(buildInfo).some(Boolean) ? { build: buildInfo } : {}),
    requestId
  };

  // Log the health status
  if (overallStatus !== 'ok') {
    requestLogger.warn(`Health check returned ${overallStatus} status`, {
      openCircuitBreakers: Object.entries(circuitBreakers)
        .filter(([_, cb]) => cb.getState().state === CircuitState.OPEN)
        .map(([name]) => name),
      failedServices: serviceChecks.filter(s => s.status === 'error').map(s => s.name)
    });
  } else {
    requestLogger.info('Health check completed successfully');
  }

  // Set appropriate status code based on health
  const statusCode = overallStatus === 'critical' ? 503 : 200;

  // Return the health check response
  res.status(statusCode).json(healthCheck);
}