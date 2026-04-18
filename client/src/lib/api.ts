import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);
