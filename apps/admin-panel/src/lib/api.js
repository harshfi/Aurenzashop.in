import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_URL;
const runtimeDefaultBaseUrl =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8080/api`
    : 'http://127.0.0.1:8080/api';

const resolvedBaseUrl =
  typeof window !== 'undefined' && envBaseUrl
    ? envBaseUrl
        .replace('http://localhost:', `http://${window.location.hostname}:`)
        .replace('https://localhost:', `https://${window.location.hostname}:`)
    : (envBaseUrl || runtimeDefaultBaseUrl);

const api = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
});

export default api;
