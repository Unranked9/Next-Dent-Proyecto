import axios from 'axios';
import { API_BASE_URL } from './api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let tokenGetter: (() => string | null) | null = null;
export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

let logoutHandler: (() => void) | null = null;
export function setLogoutHandler(fn: () => void) {
  logoutHandler = fn;
}

axiosInstance.interceptors.request.use((config) => {
  const token = tokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? 'desconocida';

    if (status === 401) {
      console.warn('[Next Dent] Sesión expirada. Redirigiendo a login...');
      logoutHandler?.();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      console.warn(`[Next Dent] Sin permisos para ${url}`);
    } else if (status === 404) {
      console.warn(`[Next Dent] 404 en ${url}`);
    } else if (status === 500) {
      console.error(`[Next Dent] Error de servidor en ${url}`);
    } else if (!error.response) {
      console.error('[Next Dent] Sin respuesta del servidor. ¿Está el backend corriendo?');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
