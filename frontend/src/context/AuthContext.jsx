import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { markSessionExpired } from '../authFetch';
import { getTokenExpiryMs } from '../jwt';

const AuthContext = createContext(null);
const EXPIRY_CHECK_INTERVAL_MS = 30_000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Proactively catch an expired token even if the user never triggers an
  // authenticated API call (authFetch's 401 handling only fires reactively).
  useEffect(() => {
    function checkExpiry() {
      const token = localStorage.getItem('token');
      if (!token) return;
      const expiryMs = getTokenExpiryMs(token);
      if (expiryMs !== null && expiryMs <= Date.now()) {
        markSessionExpired();
        setUser(null);
        if (window.location.pathname !== '/login') navigate('/login');
      }
    }
    checkExpiry();
    const interval = setInterval(checkExpiry, EXPIRY_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
