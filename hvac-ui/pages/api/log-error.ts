import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint for client-side error logging
 * In production, this would store errors in a database or send to a monitoring service
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const errorData = req.body;
    
    // Add server timestamp
    const logEntry = {
      ...errorData,
      serverTimestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };
    
    // In production, you would store this in a database or send to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: await db.collection('errors').insertOne(logEntry);
      // Example: await sendToMonitoringService(logEntry);
      
      // For now, just log to console
      console.error('[Server] Client error logged:', logEntry);
    } else {
      // In development, log to console
      console.error('[Server] Client error logged:', logEntry);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging client error:', error);
    return res.status(500).json({ message: 'Error logging client error' });
  }
}