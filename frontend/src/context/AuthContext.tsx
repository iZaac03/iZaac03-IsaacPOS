import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Store } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  store: Store | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (pinCode: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pinCode: string) => Promise<{ valid: boolean; approver?: any; message: string }>;
  switchStore?: (store: Store) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Clear any persistent localStorage auto-login tokens on first page load
  useEffect(() => {
    localStorage.removeItem('isaacpos_token');
    localStorage.removeItem('isaacpos_user');
    localStorage.removeItem('isaacpos_store');
    localStorage.removeItem('klaropos_token');
    localStorage.removeItem('klaropos_user');
    localStorage.removeItem('klaropos_store');
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('isaacpos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('isaacpos_token');
  });
  const [store, setStore] = useState<Store | null>(() => {
    const saved = sessionStorage.getItem('isaacpos_store');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          if (res.data.user.store) {
            setStore(res.data.user.store);
            sessionStorage.setItem('isaacpos_store', JSON.stringify(res.data.user.store));
          }
          sessionStorage.setItem('isaacpos_user', JSON.stringify(res.data.user));
          sessionStorage.setItem('isaacpos_token', token);
        } catch (err) {
          console.error('Session expired', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;

    setToken(newToken);
    setUser(newUser);
    if (newUser.store) {
      setStore(newUser.store);
      sessionStorage.setItem('isaacpos_store', JSON.stringify(newUser.store));
    }
    sessionStorage.setItem('isaacpos_token', newToken);
    sessionStorage.setItem('isaacpos_user', JSON.stringify(newUser));
  };

  const loginWithPin = async (pinCode: string) => {
    const res = await api.post('/auth/login-pin', { pin_code: pinCode });
    const { token: newToken, user: newUser } = res.data;

    setToken(newToken);
    setUser(newUser);
    if (newUser.store) {
      setStore(newUser.store);
      sessionStorage.setItem('isaacpos_store', JSON.stringify(newUser.store));
    }
    sessionStorage.setItem('isaacpos_token', newToken);
    sessionStorage.setItem('isaacpos_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      setToken(null);
      setStore(null);
      sessionStorage.clear();
      localStorage.removeItem('isaacpos_token');
      localStorage.removeItem('isaacpos_user');
      localStorage.removeItem('isaacpos_store');
      localStorage.removeItem('klaropos_token');
      localStorage.removeItem('klaropos_user');
      localStorage.removeItem('klaropos_store');
    }
  };

  const verifyPin = async (pinCode: string) => {
    try {
      const res = await api.post('/auth/verify-pin', { pin_code: pinCode });
      return res.data;
    } catch (err: any) {
      return {
        valid: false,
        message: err.response?.data?.message || 'Invalid Supervisor PIN code',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithPin,
        logout,
        verifyPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
