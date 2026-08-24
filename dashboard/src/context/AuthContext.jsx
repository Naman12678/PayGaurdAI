import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../api/coreApiClient.js';

const AuthContext = createContext(null);

function readStoredMerchant() {
  try {
    const raw = sessionStorage.getItem('merchant');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [merchant, setMerchant] = useState(readStoredMerchant);
  const [ready, setReady] = useState(false);

  const persist = useCallback((token, merchantData) => {
    sessionStorage.setItem('jwt', token);
    sessionStorage.setItem('merchant', JSON.stringify(merchantData));
    setMerchant(merchantData);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token, merchant: m } = await apiLogin(email, password);
      persist(token, m);
      return m;
    },
    [persist]
  );

  const register = useCallback(
    async (email, password, name) => {
      const { token, merchant: m } = await apiRegister(email, password, name);
      persist(token, m);
      return m;
    },
    [persist]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem('jwt');
    sessionStorage.removeItem('merchant');
    setMerchant(null);
  }, []);

  // Confirms the stored token is still valid on first load / hard refresh.
  // Called once by ProtectedRoute so public pages never pay this cost.
  const verify = useCallback(async () => {
    if (!sessionStorage.getItem('jwt')) {
      setReady(true);
      return null;
    }
    try {
      const me = await getMe();
      sessionStorage.setItem('merchant', JSON.stringify(me));
      setMerchant(me);
      return me;
    } catch {
      logout();
      return null;
    } finally {
      setReady(true);
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ merchant, isAuthenticated: !!merchant, ready, login, register, logout, verify }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
