/**
 * Utility functions for token management
 * These functions are used by the axios interceptors and can be used
 * outside of React components where hooks can't be used
 */

// Get token from localStorage
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Set token in localStorage
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
};

// Get refresh token from localStorage
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

// Set refresh token in localStorage
export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('refreshToken', token);
};

// Remove refresh token from localStorage
export const removeRefreshToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('refreshToken');
};

// Clear all auth tokens
export const clearTokens = (): void => {
  removeToken();
  removeRefreshToken();
};