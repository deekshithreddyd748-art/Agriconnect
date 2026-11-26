import axios from 'axios';
import { getSavedGuestUser, handleDemoApiRequest } from './demoStore';

const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  withCredentials: true,
  timeout: 6000,
});

api.interceptors.request.use((config) => {
  // Always serve Guest / Demo sessions from isolated client demoStore without touching live backend auth
  if (getSavedGuestUser()) {
    config.adapter = () => Promise.resolve(handleDemoApiRequest(config));
    return config;
  }

  const token = localStorage.getItem('agriconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isHtmlFallbackResponse(response) {
  return (
    typeof response?.data === 'string' &&
    response.data.trim().toLowerCase().startsWith('<!doctype')
  );
}

api.interceptors.response.use(
  (response) => {
    // On Vercel SPA hosting without a backend URL, /api/* falls back to index.html (200 HTML)
    if (isHtmlFallbackResponse(response)) {
      const url = String(response?.config?.url || '');
      if (url.includes('/profiles/continue') || url.includes('/auth/me')) {
        return Promise.reject(
          new Error('Backend authentication server is unreachable on this deployment. You can continue as Guest or sign in with the Demo Account.')
        );
      }
      return handleDemoApiRequest(response.config);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthAttempt =
      url.includes('/profiles/continue') ||
      url.includes('/auth/me');

    // Never hide explicit profile-identification / auth errors on /login
    if (isAuthAttempt) {
      if (status === 401 && !url.includes('/auth/me') && typeof window !== 'undefined') {
        localStorage.removeItem('agriconnect_token');
        window.dispatchEvent(new Event('agriconnect:session-expired'));
      }
      return Promise.reject(error);
    }

    // For public discovery / read browsing when backend or Supabase is not configured (503 / network / 404 on static Vercel),
    // gracefully fall back to local demo datasets so visitors never hit empty screens.
    const isBackendUnavailable =
      !error?.response ||
      status === 503 ||
      status === 502 ||
      status === 404;

    if (isBackendUnavailable && (error?.config?.method || 'get').toLowerCase() === 'get' && !url.startsWith('/admin')) {
      return Promise.resolve(handleDemoApiRequest(error.config));
    }

    if (status === 401 && typeof window !== 'undefined' && !getSavedGuestUser()) {
      localStorage.removeItem('agriconnect_token');
      window.dispatchEvent(new Event('agriconnect:session-expired'));
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err, fallback = 'Something went wrong.') {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export default api;
