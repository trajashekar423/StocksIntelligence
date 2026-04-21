import api from './api';
import { removeToken } from '../utils/authStorage';

export const loginUser = async ({ email, password }) => {
  const { data } = await api.post('/api/v1/auth/login/', { email, password });
  return data; // expects { token, user }
};

export const logoutUser = () => removeToken();
