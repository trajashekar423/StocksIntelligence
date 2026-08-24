import axios from 'axios';
import { getToken, removeToken } from '../utils/authStorage';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || '';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login/');

    if (error.response?.status === 401 && !isLoginRequest) {
      console.warn('401 on:', error.config?.url, '— token:', getToken());
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
