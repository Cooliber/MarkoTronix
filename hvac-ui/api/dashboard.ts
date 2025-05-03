import { api } from './axios';

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getRecentActivity = async () => {
  try {
    const response = await api.get('/dashboard/activity');
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

export const getUpcomingServices = async () => {
  try {
    const response = await api.get('/dashboard/upcoming-services');
    return response.data;
  } catch (error) {
    console.error('Error fetching upcoming services:', error);
    throw error;
  }
};

export const getRevenueStats = async (period: 'week' | 'month' | 'year' = 'month') => {
  try {
    const response = await api.get(`/dashboard/revenue?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    throw error;
  }
};