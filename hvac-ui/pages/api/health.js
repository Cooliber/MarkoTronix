/**
 * Health check API endpoint
 * This endpoint is used by deployment platforms to check if the application is running
 */

export default function handler(req, res) {
  // Get the current timestamp
  const timestamp = new Date().toISOString();
  
  // Get the environment
  const environment = process.env.NODE_ENV || 'development';
  
  // Get the application version
  const version = process.env.APP_VERSION || '1.0.0';
  
  // Get the uptime
  const uptime = process.uptime();
  
  // Get the memory usage
  const memoryUsage = process.memoryUsage();
  
  // Return the health check response
  res.status(200).json({
    status: 'ok',
    timestamp,
    environment,
    version,
    uptime,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    },
  });
}