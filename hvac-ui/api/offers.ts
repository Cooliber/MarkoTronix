import { api, OFFER_SERVICE_URL, LINK_SERVICE_URL } from './axios';
import axios from 'axios';

// Create dedicated axios instances for the services
const offerApi = axios.create({
  baseURL: OFFER_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const linkApi = axios.create({
  baseURL: LINK_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOffers = async (skip = 0, limit = 100) => {
  try {
    try {
      const response = await api.get(`/gateway/offers`, {
        params: { skip, limit }
      });
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await offerApi.get(`/offers`, {
        params: { skip, limit }
      });
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
};

export const getOffer = async (offerId: number) => {
  try {
    try {
      const response = await api.get(`/gateway/offers/${offerId}`);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await offerApi.get(`/offers/${offerId}`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching offer ${offerId}:`, error);
    throw error;
  }
};

export const generateOffer = async (emailId: number) => {
  try {
    try {
      const response = await api.post(`/gateway/offers/generate`, {
        email_id: emailId
      });
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await offerApi.post(`/offers/generate`, {
        email_id: emailId
      });
      return response.data;
    }
  } catch (error) {
    console.error(`Error generating offer for email ${emailId}:`, error);
    throw error;
  }
};

export const getOfferPdfUrl = (offerId: number) => {
  try {
    return `${api.defaults.baseURL}/gateway/offers/${offerId}/pdf`;
  } catch (error) {
    // Fallback to direct service URL
    return `${OFFER_SERVICE_URL}/offers/${offerId}/pdf`;
  }
};

export const getOfferLink = async (offerId: number) => {
  try {
    try {
      const response = await api.get(`/gateway/links/offers/${offerId}/link`);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await linkApi.get(`/offers/${offerId}/link`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error getting link for offer ${offerId}:`, error);
    throw error;
  }
};

export const requestSignature = async (offerId: number, data: any) => {
  try {
    try {
      const response = await api.post(`/gateway/links/offers/${offerId}/signature`, data);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await linkApi.post(`/offers/${offerId}/signature`, data);
      return response.data;
    }
  } catch (error) {
    console.error(`Error requesting signature for offer ${offerId}:`, error);
    throw error;
  }
};

export const getSignatureStatus = async (signatureId: string) => {
  try {
    try {
      const response = await api.get(`/gateway/links/signature/${signatureId}/status`);
      return response.data;
    } catch (gatewayError) {
      console.warn('Gateway error, trying direct service:', gatewayError);
      const response = await linkApi.get(`/signature/${signatureId}/status`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error getting signature status for ${signatureId}:`, error);
    throw error;
  }
};