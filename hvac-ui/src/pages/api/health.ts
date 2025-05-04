import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  status: string;
  version: string;
  timestamp: string;
  environment: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
};

/**
 * Health check endpoint for monitoring and deployment platforms
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Get process uptime
  const uptime = process.uptime();
  
  // Get application version from package.json
  const version = process.env.npm_package_version || '1.0.0';
  
  // Get environment
  const environment = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';
  
  // Return health check response
  res.status(200).json({
    status: 'ok',
    version,
    timestamp: new Date().toISOString(),
    environment,
    uptime,
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
  });
}