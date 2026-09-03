import axios from 'axios';

// The Vite server proxies /api to http://127.0.0.1:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Automatically attach Sanctum Bearer token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('isaacpos_token') || localStorage.getItem('klaropos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if not already there
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
