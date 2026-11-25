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

    const token = localStorage.getItem('agriconnect_token');
    if (!token) {
      setLoading(false);
      return () => window.removeEventListener('agriconnect:session-expired', handleSessionExpired);
    }
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

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('agriconnect_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('agriconnect_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function getOtpStatus() {
    const res = await api.get('/auth/otp/status');
    return res.data.data;
  }

  async function sendOtp(mobileNumber) {
    const res = await api.post('/auth/send-otp', { mobileNumber });
    return res.data;
  }

  async function verifyOtp(mobileNumber, otp) {
    const res = await api.post('/auth/verify-otp', { mobileNumber, otp });
    if (!res.data.isNewUser && res.data.token) {
      localStorage.setItem('agriconnect_token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  }

  async function completeOtpOnboarding(payload) {
    const res = await api.post('/auth/complete-farmer-profile', payload);
    localStorage.setItem('agriconnect_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
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
        login,
        register,
        getOtpStatus,
        sendOtp,
        verifyOtp,
        completeOtpOnboarding,
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
