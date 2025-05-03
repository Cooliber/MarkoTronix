import { NextApiRequest, NextApiResponse } from 'next';

/**
 * This API route handles callbacks from specific n8n workflow types
 * The workflow type is specified in the URL path
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the workflow type from the URL path
    const { workflowType } = req.query;
    
    // Get the data from the request body
    const data = req.body;
    
    // Process the callback based on the workflow type
    switch (workflowType) {
      case 'customer-notification':
        // Process customer notification callback
        console.log('Received customer notification callback:', data);
        // In a real implementation, you would update the notification status in the database
        break;
        
      case 'warranty-registration':
        // Process warranty registration callback
        console.log('Received warranty registration callback:', data);
        // In a real implementation, you would update the warranty status in the database
        break;
        
      case 'service-report-generation':
        // Process service report generation callback
        console.log('Received service report generation callback:', data);
        // In a real implementation, you would update the service report status in the database
        break;
        
      case 'invoice-generation':
        // Process invoice generation callback
        console.log('Received invoice generation callback:', data);
        // In a real implementation, you would update the invoice status in the database
        break;
        
      default:
        // Unknown workflow type
        return res.status(400).json({ 
          success: false, 
          error: `Unknown workflow type: ${workflowType}` 
        });
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true,
      message: `Successfully processed ${workflowType} callback`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`Error handling ${req.query.workflowType} callback:`, error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    });
  }
}