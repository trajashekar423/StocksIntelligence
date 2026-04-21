import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser } from '../services/authService';
import { setToken, getToken } from '../utils/authStorage';

export default function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return { login, logout, user, isAuthenticated };
}
