import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * This API route checks the status of the n8n server
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the n8n server URL from environment variables or use a default
    const n8nUrl = process.env.N8N_URL || 'http://localhost:5678';
    
    // Check if the n8n server is available
    const response = await axios.get(`${n8nUrl}/healthz`, {
      timeout: 5000
    }).catch(error => {
      console.error('Error checking n8n connection:', error);
      return { status: 500 };
    });
    
    // Return the status
    return res.status(200).json({ 
      success: response.status === 200,
      url: n8nUrl,
      status: response.status === 200 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error checking n8n status:', error);
    return res.status(500).json({ 
      success: false, 
      status: 'error',
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}