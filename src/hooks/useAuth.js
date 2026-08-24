'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, logoutUser } from '../services/authService';
import { setToken, getToken, getUser, setUser as storeUser } from '../utils/authStorage';

export default function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
    setUser(getUser());
  }, []);

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
    router.push('/dashboard');
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return { login, logout, user, isAuthenticated };
}
