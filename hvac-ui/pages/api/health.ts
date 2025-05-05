import { NextApiRequest, NextApiResponse } from 'next';

// Start time of the service
const START_TIME = Date.now();

/**
 * Health check endpoint for the frontend
 * This is used by monitoring systems to check if the frontend is running
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Calculate uptime
    const uptime = Math.floor((Date.now() - START_TIME) / 1000);
    
    // Get build info
    const buildInfo = {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
    };
    
    // Return health status
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      buildInfo,
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
    });
  }
}