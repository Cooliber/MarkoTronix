import { api } from './axios';

export interface DashboardStats {
  newEmails: number;
  tasksToday: number;
  activeOffers: number;
  monthlyRevenue: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values if API fails
    return {
      newEmails: 0,
      tasksToday: 0,
      activeOffers: 0,
      monthlyRevenue: 0,
    };
  }
};