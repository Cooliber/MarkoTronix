import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // If token is expired and we're not already trying to refresh
        if (decoded.exp < currentTime && !config.url?.includes('/auth/refresh')) {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });
              
              const { access_token, refresh_token } = response.data;
              
              localStorage.setItem('token', access_token);
              localStorage.setItem('refreshToken', refresh_token);
              
              // Update the request header with the new token
              config.headers.Authorization = `Bearer ${access_token}`;
            } catch (error) {
              // If refresh fails, redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
              return Promise.reject(error);
            }
          } else {
            // No refresh token available
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(new Error('No refresh token available'));
          }
        } else {
          // Token is still valid
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token } = response.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        
        // Update the request header with the new token
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);