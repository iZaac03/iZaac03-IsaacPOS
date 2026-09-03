import axios, { AxiosAdapter } from 'axios';
import { handleMockResponse } from './mockService';

// Detect if running on Vercel, Netlify, or standalone deployment without cloud backend
export const isStandaloneDemo =
  typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1') &&
  !import.meta.env.VITE_API_URL;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Standalone Mock Adapter for Vercel
const mockAdapter: AxiosAdapter = async (config) => {
  const url = config.url || '';
  const method = config.method || 'get';
  const res = await handleMockResponse(url, method, config.data, config.params);
  return {
    data: res.data,
    status: res.status,
    statusText: 'OK',
    headers: {},
    config,
  };
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  ...(isStandaloneDemo ? { adapter: mockAdapter } : {}),
});

// Automatically attach Sanctum Bearer token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('isaacpos_token') || localStorage.getItem('klaropos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fallback & 401 handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend 404 or connection failed on localhost, seamlessly fall back to client mock
    if (
      error.config &&
      !(error.config as any)._isMockRetry &&
      (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response)
    ) {
      (error.config as any)._isMockRetry = true;
      try {
        const res = await handleMockResponse(
          error.config.url || '',
          error.config.method || 'get',
          error.config.data,
          error.config.params
        );
        return {
          data: res.data,
          status: res.status,
          statusText: 'OK',
          headers: {},
          config: error.config,
        };
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('isaacpos_token');
      localStorage.removeItem('isaacpos_user');
      localStorage.removeItem('klaropos_token');
      localStorage.removeItem('klaropos_user');
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);
