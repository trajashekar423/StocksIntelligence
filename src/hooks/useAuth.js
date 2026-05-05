import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser } from '../services/authService';
import { setToken, getToken, setUser as storeUser } from '../utils/authStorage';

export default function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    if (!data.token) {
      console.warn('Login succeeded but no token found — check LOGIN RESPONSE log above.');
      return;
    }
    console.log('STORING TOKEN:', data.token);
    setToken(data.token);
    storeUser(data.user);
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
