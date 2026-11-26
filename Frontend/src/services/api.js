import axios from 'axios';

const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agriconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthAttempt =
      url.includes('/profiles/continue') ||
      url.includes('/auth/me');

    if (status === 401 && !isAuthAttempt && typeof window !== 'undefined') {
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
