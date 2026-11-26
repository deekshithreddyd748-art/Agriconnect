import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleSessionExpired() {
      localStorage.removeItem('agriconnect_token');
      setUser(null);
    }
    window.addEventListener('agriconnect:session-expired', handleSessionExpired);

    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('agriconnect_token');
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('agriconnect:session-expired', handleSessionExpired);
  }, []);

  async function continueProfile({ fullName, mobileNumber, email, confirmUseExisting = false }) {
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
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('agriconnect_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
