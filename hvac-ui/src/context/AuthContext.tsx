import { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
const jwt_decode = require('jwt-decode');
import { api } from '@/api/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Verify token is valid
          const decoded: any = jwt_decode(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            // Token expired
            localStorage.removeItem('token');
            setUser(null);
          } else {
            // Set token in axios headers
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Get user info
            const response = await api.get('/auth/me');
            setUser(response.data);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      router.push('/login');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Register the user
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // If registration is successful, automatically log in the user
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
