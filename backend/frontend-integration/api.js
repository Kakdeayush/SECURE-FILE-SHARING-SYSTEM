import axios from 'axios';

// Get base URL from env if available, else local SpringBoot default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle 401 → auto logout
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    const isPublicRoute =
      window.location.pathname.startsWith('/file/') ||
      window.location.pathname === '/login' ||
      window.location.pathname === '/register';
    if (!isPublicRoute) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

// ─────────────────────────────────────────────────────────────
// FILES
// ─────────────────────────────────────────────────────────────

export const filesAPI = {
  list: () => api.get('/files'),
  delete: (id) => api.delete(`/files/${id}`),
  upload: (formData, onUploadProgress) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
};

// ─────────────────────────────────────────────────────────────
// PUBLIC (no auth needed)
// ─────────────────────────────────────────────────────────────

export const publicAPI = {
  getFileInfo: (token) => api.get(`/public/info/${token}`),
  verifyPassword: (token, password) =>
    api.post(`/public/verify-password/${token}`, { password }),
  getDownloadUrl: (token, password) => {
    const base = `${API_BASE_URL}/public/download/${token}`;
    return password ? `${base}?password=${encodeURIComponent(password)}` : base;
  },
};

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

export const analyticsAPI = {
  get: () => api.get('/analytics'),
};
