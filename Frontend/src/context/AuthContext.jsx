import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import {
  clearGuestSession,
  createGuestUserForRole,
  getSavedGuestUser,
  saveGuestUser,
} from '../services/demoStore';

const AuthContext = createContext(null);

export const DEMO_ACCOUNT_CREDENTIALS = {
  email: 'demo@agriconnect.in',
  password: 'Demo@123',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleSessionExpired() {
      if (getSavedGuestUser()) return;
      localStorage.removeItem('agriconnect_token');
      setUser(null);
    }
    window.addEventListener('agriconnect:session-expired', handleSessionExpired);

    // 1. Immediately restore persisted Guest / Demo session across page refreshes
    const savedGuest = getSavedGuestUser();
    if (savedGuest) {
      setUser(savedGuest);
      setLoading(false);
      return () => window.removeEventListener('agriconnect:session-expired', handleSessionExpired);
    }

    // 2. Otherwise verify real backend session (only when token exists or cookie might be present)
    const hasToken = Boolean(localStorage.getItem('agriconnect_token'));
    if (!hasToken) {
      setUser(null);
      setLoading(false);
      return () => window.removeEventListener('agriconnect:session-expired', handleSessionExpired);
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data?.user || null))
      .catch(() => {
        localStorage.removeItem('agriconnect_token');
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('agriconnect:session-expired', handleSessionExpired);
  }, []);

  function enterGuestMode(role = 'farmer', options = {}) {
    localStorage.removeItem('agriconnect_token');
    const guestUser = createGuestUserForRole(role, options);
    saveGuestUser(guestUser);
    setUser(guestUser);
    setLoading(false);
    return guestUser;
  }

  function loginDemoUser(email, password) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');
    if (
      cleanEmail !== DEMO_ACCOUNT_CREDENTIALS.email ||
      cleanPass !== DEMO_ACCOUNT_CREDENTIALS.password
    ) {
      throw new Error(
        `Invalid demo credentials. Use Email: ${DEMO_ACCOUNT_CREDENTIALS.email} and Password: ${DEMO_ACCOUNT_CREDENTIALS.password}, or click Continue as Guest.`
      );
    }
    return enterGuestMode('farmer', { isDemoAccount: true });
  }

  function switchDemoRole(nextRole) {
    if (!user?.isGuest) return null;
    const updated = createGuestUserForRole(nextRole, {
      isDemoAccount: Boolean(user?.isDemoAccount),
    });
    saveGuestUser(updated);
    setUser(updated);
    return updated;
  }

  async function continueProfile({ fullName, mobileNumber, email, confirmUseExisting = false }) {
    clearGuestSession();
    const res = await api.post('/profiles/continue', {
      fullName,
      mobileNumber,
      email: email || '',
      confirmUseExisting,
    });
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('agriconnect_token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  }

  async function selectProfileRole(profileId, role) {
    const res = await api.patch(`/profiles/${profileId}/role`, { role });
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  }

  async function updateProfile(payload) {
    const endpoint = user?.role === 'farmer' ? '/farmer/profile' : '/auth/profile';
    const res = await api.put(endpoint, payload);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    if (!user?.isGuest) {
      api.post('/auth/logout').catch(() => {});
    }
    clearGuestSession();
    localStorage.removeItem('agriconnect_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: Boolean(user?.isGuest),
        isAuthenticated: Boolean(user && !user.isGuest),
        enterGuestMode,
        loginDemoUser,
        switchDemoRole,
        continueProfile,
        selectProfileRole,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
