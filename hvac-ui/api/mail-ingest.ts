import axios from 'axios';

// Types
export interface Attachment {
  id: number;
  email_id: number;
  filename: string;
  content_type: string;
  file_path: string;
  created_at: string;
  processed_data?: ProcessedAttachment;
}

export interface ProcessedAttachment {
  id: number;
  attachment_id: number;
  success: boolean;
  text_content?: string;
  metadata?: Record<string, any>;
  entities?: Record<string, any>;
  tags?: string[];
  confidence: number;
  error_message?: string;
  supabase_path?: string;
  public_url?: string;
  processed_at: string;
}

export interface Email {
  id: number;
  message_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  received_date: string;
  processed: boolean;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface AttachmentStats {
  total_attachments: number;
  processed_attachments: number;
  successful_processing: number;
  processing_success_rate: number;
  content_type_counts: Record<string, number>;
  tag_counts: Record<string, number>;
  entity_type_counts: Record<string, number>;
  average_confidence: number;
}

export interface SearchParams {
  q?: string;
  tags?: string[];
  entity_type?: string;
  min_confidence?: number;
  limit?: number;
  offset?: number;
}

export interface FeedbackData {
  attachmentId: number;
  processedAttachmentId: number;
  correctedEntities: Record<string, any>;
  correctedTags: string[];
  missingEntities: Record<string, any>;
  missingTags: string[];
  feedbackNotes: string;
  rating: number;
}

// API client
const API_URL = process.env.NEXT_PUBLIC_MAIL_INGEST_API_URL || 'http://localhost:8000';

const mailIngestApi = {
  // Emails
  getEmails: async (): Promise<Email[]> => {
    const response = await axios.get(`${API_URL}/emails`);
    return response.data;
  },

  getEmail: async (emailId: number): Promise<Email> => {
    const response = await axios.get(`${API_URL}/emails/${emailId}`);
    return response.data;
  },

  getEmailAttachments: async (emailId: number): Promise<Attachment[]> => {
    const response = await axios.get(`${API_URL}/emails/${emailId}/attachments`);
    return response.data;
  },

  getEmailProcessedAttachments: async (emailId: number): Promise<Attachment[]> => {
    const response = await axios.get(`${API_URL}/emails/${emailId}/attachments/processed`);
    return response.data;
  },

  reprocessEmail: async (emailId: number): Promise<void> => {
    await axios.post(`${API_URL}/emails/${emailId}/reprocess`);
  },

  // Attachments
  getProcessedAttachment: async (attachmentId: number): Promise<ProcessedAttachment> => {
    const response = await axios.get(`${API_URL}/attachments/${attachmentId}/processed`);
    return response.data;
  },

  reprocessAttachment: async (attachmentId: number): Promise<void> => {
    await axios.post(`${API_URL}/attachments/${attachmentId}/reprocess`);
  },

  searchAttachments: async (params: SearchParams): Promise<Attachment[]> => {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    if (params.entity_type) queryParams.append('entity_type', params.entity_type);
    if (params.min_confidence !== undefined) queryParams.append('min_confidence', params.min_confidence.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const response = await axios.get(`${API_URL}/attachments/search?${queryParams.toString()}`);
    return response.data;
  },

  getAttachmentStats: async (): Promise<AttachmentStats> => {
    const response = await axios.get(`${API_URL}/attachments/stats`);
    return response.data;
  },

  // Feedback
  submitFeedback: async (attachmentId: number, feedbackData: FeedbackData): Promise<any> => {
    const response = await axios.post(`${API_URL}/attachments/${attachmentId}/feedback`, feedbackData);
    return response.data;
  },

  getAttachmentFeedback: async (attachmentId: number): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/attachments/${attachmentId}/feedback`);
    return response.data;
  },

  // Utility
  manualFetch: async (): Promise<void> => {
    await axios.post(`${API_URL}/manual/fetch`);
  }
};

export default mailIngestApi;