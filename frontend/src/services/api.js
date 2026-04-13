import axios from 'axios';

// Get base URL from env if available, else local SpringBoot default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle responses, e.g. logout on 401
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  // If the error response status is 401, we might want to logout the user
  if (error.response && error.response.status === 401) {
    // We shouldn't force redirect if we are already on login or public download route
    const isPublicRoute = window.location.pathname.startsWith('/file/') || window.location.pathname === '/login' || window.location.pathname === '/register';
    if (!isPublicRoute) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
