import { api, MAIL_SERVICE_URL } from './axios';
import axios from 'axios';

// Create a dedicated axios instance for the mail service
const mailApi = axios.create({
  baseURL: MAIL_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getEmails = async (skip = 0, limit = 100) => {
  try {
    // Try the API gateway first
    try {
      const response = await api.get(`/gateway/mail/emails`, {
        params: { skip, limit }
      });
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      // Fall back to direct service call if gateway fails
      const response = await mailApi.get(`/emails`, {
        params: { skip, limit }
      });
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

export const getEmail = async (emailId: number) => {
  try {
    try {
      const response = await api.get(`/gateway/mail/emails/${emailId}`);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await mailApi.get(`/emails/${emailId}`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching email ${emailId}:`, error);
    throw error;
  }
};

export const getEmailAttachments = async (emailId: number) => {
  try {
    try {
      const response = await api.get(`/gateway/mail/emails/${emailId}/attachments`);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await mailApi.get(`/emails/${emailId}/attachments`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching attachments for email ${emailId}:`, error);
    throw error;
  }
};

export const triggerEmailFetch = async () => {
  try {
    try {
      const response = await api.post(`/gateway/mail/manual/fetch`);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await mailApi.post(`/manual/fetch`);
      return response.data;
    }
  } catch (error) {
    console.error('Error triggering email fetch:', error);
    throw error;
  }
};

export const reprocessEmail = async (emailId: number) => {
  try {
    try {
      const response = await api.post(`/gateway/mail/emails/${emailId}/reprocess`);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await mailApi.post(`/emails/${emailId}/reprocess`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error reprocessing email ${emailId}:`, error);
    throw error;
  }
};