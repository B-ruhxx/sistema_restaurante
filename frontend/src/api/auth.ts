import axios from 'axios';
import type { AxiosError } from 'axios';
import { queryClient } from '../lib/queryClient';
import { toast } from '../lib/notifications';
import { useAuthStore } from '../store/authStore';

// Create an Axios instance for all API calls
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
});

// Request interceptor: attach JWT token if present
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PUBLIC_PATHS = ['/auth/login', '/api/uploads/'];

const isPublicRequest = (url?: string) => {
  if (!url) return false;
  return PUBLIC_PATHS.some((path) => url.includes(path));
};

const getApiErrorMessage = (error: AxiosError<AppApiErrorPayload | string>) => {
  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (typeof data === 'object' && data && typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  const firstValidationError = typeof data === 'object' && data?.validationErrors
    ? Object.values(data.validationErrors).find(Boolean)
    : null;
  if (typeof firstValidationError === 'string') {
    return firstValidationError;
  }

  if (status === 400) return 'Revisa los datos enviados.';
  if (status === 404) return 'No se encontro el recurso solicitado.';
  if (status === 409) return 'Ya existe un registro con esos datos.';
  if (status !== undefined && status >= 500) return 'Ocurrio un error en el servidor.';
  return 'No se pudo completar la operacion.';
};

let isRedirectingToLogin = false;

const clearSessionAndRedirect = () => {
  localStorage.removeItem('token');
  useAuthStore.getState().reset();
  queryClient.cancelQueries();
  queryClient.removeQueries();

  if (window.location.pathname !== '/login' && !isRedirectingToLogin) {
    isRedirectingToLogin = true;
    toast.warning('Tu sesion expiro o fue iniciada en otro dispositivo.');
    window.location.href = '/login';
  }
};

// Response interceptor: on private 401, clear session and redirect to login
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isPublic = isPublicRequest(error.config?.url);

    if (status === 401 && !isPublic) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (status && [400, 404, 409, 500].includes(status) && !isPublic) {
      toast.error(getApiErrorMessage(error));
    }

    return Promise.reject(error);
  }
);

export default authApi;
