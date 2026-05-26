import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_URL;
const isLocalHost = (hostname = '') =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

const resolveBaseUrl = () => {
  if (typeof window === 'undefined') {
    return envBaseUrl || 'http://127.0.0.1:8080/api';
  }

  const fallback = `${window.location.protocol}//${window.location.hostname}:8080/api`;
  const candidate = envBaseUrl || fallback;

  try {
    const parsed = new URL(candidate);
    if (isLocalHost(parsed.hostname)) {
      parsed.hostname = window.location.hostname;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      error.isAuthError = true;
    }
    return Promise.reject(error);
  }
);

export default api;
