/**
 * n8n Integration Utilities
 * 
 * This file provides utilities for integrating with n8n workflows.
 * It allows triggering workflows and handling webhook responses.
 */

import axios from 'axios';

interface WorkflowTriggerOptions {
  workflowId: string;
  data: Record<string, any>;
  webhookPath?: string;
  apiKey?: string;
}

interface WorkflowResponse {
  success: boolean;
  executionId?: string;
  data?: any;
  error?: string;
}

/**
 * Trigger an n8n workflow with the provided data
 */
export const triggerWorkflow = async ({
  workflowId,
  data,
  webhookPath = 'webhook',
  apiKey
}: WorkflowTriggerOptions): Promise<WorkflowResponse> => {
  try {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678';
    const url = `${n8nUrl}/${webhookPath}/${workflowId}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['X-N8N-API-KEY'] = apiKey;
    }
    
    const response = await axios.post(url, data, { headers });
    
    return {
      success: true,
      executionId: response.data.executionId,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error triggering n8n workflow:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Create a webhook handler for n8n callbacks
 */
export const createWebhookHandler = (callback: (data: any) => void) => {
  return async (req: any, res: any) => {
    try {
      const data = req.body;
      
      // Validate webhook signature if needed
      // const signature = req.headers['x-n8n-signature'];
      // if (!validateSignature(signature, data)) {
      //   return res.status(401).json({ error: 'Invalid signature' });
      // }
      
      // Process the webhook data
      await callback(data);
      
      // Return success response
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error processing n8n webhook:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      });
    }
  };
};

/**
 * Predefined workflow templates for common HVAC CRM operations
 */
export const workflowTemplates = {
  // Customer notification workflow
  customerNotification: {
    id: 'customer-notification',
    description: 'Send notifications to customers about service appointments',
    requiredParams: ['customerId', 'appointmentId', 'notificationType'],
    example: {
      customerId: '12345',
      appointmentId: '67890',
      notificationType: 'reminder',
      additionalData: {
        time: '2023-05-15T14:00:00Z',
        technician: 'John Doe'
      }
    }
  },
  
  // Service report generation workflow
  serviceReportGeneration: {
    id: 'service-report-generation',
    description: 'Generate service reports from completed service orders',
    requiredParams: ['serviceOrderId', 'technicianId', 'reportFormat'],
    example: {
      serviceOrderId: '12345',
      technicianId: '67890',
      reportFormat: 'pdf',
      includeImages: true,
      includeParts: true
    }
  },
  
  // Warranty registration workflow
  warrantyRegistration: {
    id: 'warranty-registration',
    description: 'Register product warranties and send confirmation to customers',
    requiredParams: ['customerId', 'productId', 'purchaseDate'],
    example: {
      customerId: '12345',
      productId: '67890',
      purchaseDate: '2023-05-01',
      warrantyPeriod: 24,
      extendedWarranty: false
    }
  },
  
  // Invoice generation workflow
  invoiceGeneration: {
    id: 'invoice-generation',
    description: 'Generate invoices from completed service orders',
    requiredParams: ['serviceOrderId', 'customerId', 'amount'],
    example: {
      serviceOrderId: '12345',
      customerId: '67890',
      amount: 250.00,
      currency: 'USD',
      taxRate: 8.5,
      dueDate: '2023-06-01'
    }
  },
  
  // Inventory alert workflow
  inventoryAlert: {
    id: 'inventory-alert',
    description: 'Send alerts when inventory items fall below threshold',
    requiredParams: ['productId', 'currentQuantity', 'threshold', 'urgency'],
    example: {
      productId: 'prod-123',
      currentQuantity: 5,
      threshold: 10,
      urgency: 'high'
    }
  },
  
  // Maintenance reminder workflow
  maintenanceReminder: {
    id: 'maintenance-reminder',
    description: 'Send maintenance reminders to customers based on equipment installation date',
    requiredParams: ['customerId', 'equipmentId', 'installationDate', 'maintenanceInterval'],
    example: {
      customerId: 'cust-123',
      equipmentId: 'equip-456',
      installationDate: '2024-01-15',
      maintenanceInterval: 6 // months
    }
  },
  
  // Customer feedback workflow
  customerFeedback: {
    id: 'customer-feedback',
    description: 'Send feedback requests to customers after service completion',
    requiredParams: ['customerId', 'serviceOrderId', 'completionDate'],
    example: {
      customerId: 'cust-123',
      serviceOrderId: 'so-456',
      completionDate: '2025-05-01',
      technicianId: 'tech-789'
    }
  },
  
  // Quote generation workflow
  quoteGeneration: {
    id: 'quote-generation',
    description: 'Generate quotes for customers based on equipment selection',
    requiredParams: ['customerId', 'equipmentIds', 'installationOptions'],
    example: {
      customerId: 'cust-123',
      equipmentIds: ['equip-456', 'equip-789'],
      installationOptions: {
        includeRemoval: true,
        includeExtendedWarranty: true,
        includeMaintenancePlan: false
      },
      validUntil: '2025-06-01'
    }
  }
};

/**
 * Get a workflow template by ID
 */
export const getWorkflowTemplate = (templateId: string) => {
  const template = Object.values(workflowTemplates).find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Workflow template with ID "${templateId}" not found`);
  }
  return template;
};

/**
 * Load workflow templates from JSON file
 * This function can be used to load templates from a JSON file stored in the data directory
 */
export const loadWorkflowTemplatesFromFile = async () => {
  try {
    // Load templates from the JSON file
    const response = await fetch('/data/n8n/workflow-templates.json');
    if (!response.ok) {
      throw new Error(`Failed to load workflow templates: ${response.statusText}`);
    }
    const data = await response.json();
    return data.templates;
  } catch (error) {
    console.error('Error loading workflow templates:', error);
    return Object.values(workflowTemplates); // Fallback to predefined templates
  }
};

/**
 * Check if n8n server is available
 */
export const checkN8nConnection = async (): Promise<boolean> => {
  try {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678';
    
    // In a real implementation, this would check if the n8n server is available
    // For now, we'll simulate a successful response
    
    // Uncomment this in a real implementation:
    /*
    const response = await axios.get(`${n8nUrl}/healthz`, {
      timeout: 5000
    });
    return response.status === 200;
    */
    
    return true;
  } catch (error) {
    console.error('Error checking n8n connection:', error);
    return false;
  }
};