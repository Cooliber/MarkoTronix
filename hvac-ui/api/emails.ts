import { api } from './axios';

export const getEmails = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get(`/gateway/mail/emails`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

export const getEmail = async (emailId: number) => {
  try {
    const response = await api.get(`/gateway/mail/emails/${emailId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching email ${emailId}:`, error);
    throw error;
  }
};

export const getEmailAttachments = async (emailId: number) => {
  try {
    const response = await api.get(`/gateway/mail/emails/${emailId}/attachments`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching attachments for email ${emailId}:`, error);
    throw error;
  }
};

export const triggerEmailFetch = async () => {
  try {
    const response = await api.post(`/gateway/mail/manual/fetch`);
    return response.data;
  } catch (error) {
    console.error('Error triggering email fetch:', error);
    throw error;
  }
};

export const reprocessEmail = async (emailId: number) => {
  try {
    const response = await api.post(`/gateway/mail/emails/${emailId}/reprocess`);
    return response.data;
  } catch (error) {
    console.error(`Error reprocessing email ${emailId}:`, error);
    throw error;
  }
};