import axios from 'axios';

// Same-origin in the Next app — no baseURL, the httpOnly cookie rides along.
export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);
