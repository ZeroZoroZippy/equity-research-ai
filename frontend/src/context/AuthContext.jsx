import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  firebaseAuth,
  loginWithGoogle,
  logout as firebaseLogout,
  getIdToken as fetchIdToken,
  trackEvent,
} from '../lib/firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  getIdToken: async () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    const result = await loginWithGoogle();
    trackEvent('login_success', { provider: 'google' });
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await firebaseLogout();
    trackEvent('logout');
  }, []);

  const getIdToken = useCallback(async () => {
    const token = await fetchIdToken();
    return token;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      getIdToken,
    }),
    [user, loading, login, logout, getIdToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
