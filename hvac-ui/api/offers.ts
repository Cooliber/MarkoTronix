import { api } from './axios';

export const getOffers = async (skip = 0, limit = 100) => {
  try {
    const response = await api.get(`/gateway/offers`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
};

export const getOffer = async (offerId: number) => {
  try {
    const response = await api.get(`/gateway/offers/${offerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching offer ${offerId}:`, error);
    throw error;
  }
};

export const generateOffer = async (emailId: number) => {
  try {
    const response = await api.post(`/gateway/offers/generate`, {
      email_id: emailId
    });
    return response.data;
  } catch (error) {
    console.error(`Error generating offer for email ${emailId}:`, error);
    throw error;
  }
};

export const getOfferPdfUrl = (offerId: number) => {
  return `${api.defaults.baseURL}/gateway/offers/${offerId}/pdf`;
};

export const getOfferLink = async (offerId: number) => {
  try {
    const response = await api.get(`/gateway/links/offers/${offerId}/link`);
    return response.data;
  } catch (error) {
    console.error(`Error getting link for offer ${offerId}:`, error);
    throw error;
  }
};

export const requestSignature = async (offerId: number, data: any) => {
  try {
    const response = await api.post(`/gateway/links/offers/${offerId}/signature`, data);
    return response.data;
  } catch (error) {
    console.error(`Error requesting signature for offer ${offerId}:`, error);
    throw error;
  }
};

export const getSignatureStatus = async (signatureId: string) => {
  try {
    const response = await api.get(`/gateway/links/signature/${signatureId}/status`);
    return response.data;
  } catch (error) {
    console.error(`Error getting signature status for ${signatureId}:`, error);
    throw error;
  }
};