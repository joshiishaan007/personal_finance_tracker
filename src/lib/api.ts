import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Same-origin in the Next app — no baseURL, the httpOnly cookie rides along.
export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  timeout: 30000,
});

// One shared in-flight refresh so a burst of 401s (many queries on app open)
// triggers a single /api/auth/refresh, not one per request.
let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    // Bare axios (not `api`) so this call never re-enters the interceptor.
    refreshing = axios
      .post('/api/auth/refresh', null, { withCredentials: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

// On a 401 (expired 30-min access token) transparently rotate via the refresh
// token and replay the original request once. Auth endpoints are excluded so a
// failed refresh/logout can't loop.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? '';
    const isAuthFlow =
      url.includes('/api/auth/refresh') || url.includes('/api/auth/logout') || url.includes('/api/auth/google');

    if (error.response?.status === 401 && original && !original._retry && !isAuthFlow) {
      original._retry = true;
      if (await refreshSession()) return api(original);
    }
    return Promise.reject(error);
  },
);
