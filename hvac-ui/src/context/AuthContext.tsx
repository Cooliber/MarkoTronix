import { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
const jwt_decode = require('jwt-decode');
import { api } from '@/api/axios';
import { useLocalStorage } from '@/hooks/usehooks';

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
  const [token, setToken, removeToken] = useLocalStorage<string | null>('token', null);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Verify token is valid
          const decoded: any = jwt_decode(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            // Token expired
            removeToken();
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
          removeToken();
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [token, removeToken]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user } = response.data;

      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

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
      removeToken();
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
      const { token: newToken, user } = response.data;

      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

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
