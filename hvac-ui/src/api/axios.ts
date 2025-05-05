import axios from 'axios';
import { getToken, setToken, getRefreshToken, clearTokens } from '@/utils/tokenStorage';
import { createCircuitBreaker } from '@/utils/circuitBreaker';
import { logger } from '@/utils/logger';

// Create circuit breaker for API calls
export const apiCircuitBreaker = createCircuitBreaker({
  name: 'api',
  failureThreshold: 3,
  recoveryTimeout: 10000, // 10 seconds
  fallback: (error) => {
    logger.error('API circuit breaker triggered fallback', error);
    // Return a fallback response or re-throw based on the error
    throw error;
  }
});

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout for better resilience
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            { refreshToken }
          );

          const { token } = response.data;
          setToken(token);

          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Execute an API call with circuit breaker protection
 * @param apiCall Function that makes the API call
 * @returns Promise with the API response
 */
export async function executeWithCircuitBreaker<T>(apiCall: () => Promise<T>): Promise<T> {
  return apiCircuitBreaker.execute(apiCall);
}