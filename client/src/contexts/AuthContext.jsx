import { createContext, useCallback, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/check');
      const authenticated = response.data?.success === true && Boolean(response.data.user);
      setUser(authenticated ? response.data.user : null);
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if ([401, 403, 404].includes(error.response?.status)) return false;
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data?.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
