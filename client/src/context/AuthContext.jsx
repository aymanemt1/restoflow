import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/resources';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resto_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem('resto_token')) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      localStorage.setItem('resto_user', JSON.stringify(me));
    } catch {
      localStorage.removeItem('resto_token');
      localStorage.removeItem('resto_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const payload = await authApi.login(email, password);
    const { token, user: u } = payload || {};
    if (!token) throw new Error('Unexpected login response from the server.');
    localStorage.setItem('resto_token', token);
    localStorage.setItem('resto_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore — token is dropped locally either way */
    }
    localStorage.removeItem('resto_token');
    localStorage.removeItem('resto_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
