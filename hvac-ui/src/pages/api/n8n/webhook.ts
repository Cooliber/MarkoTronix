import { NextApiRequest, NextApiResponse } from 'next';
import { createWebhookHandler } from '@/utils/n8nIntegration';

/**
 * This API route handles incoming webhooks from n8n
 * It can be used to receive callbacks from n8n workflows
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Process the webhook data
    const webhookHandler = createWebhookHandler(async (data) => {
      // In a real implementation, you would process the webhook data here
      // For example, you could update a database, send a notification, etc.
      console.log('Received webhook data from n8n:', data);
      
      // Example: Store the webhook data in a database
      // await prisma.webhookEvent.create({
      //   data: {
      //     source: 'n8n',
      //     eventType: data.eventType || 'unknown',
      //     payload: JSON.stringify(data),
      //     receivedAt: new Date()
      //   }
      // });
    });
    
    // Call the webhook handler
    return await webhookHandler(req, res);
  } catch (error: any) {
    console.error('Error handling n8n webhook:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    });
  }
}