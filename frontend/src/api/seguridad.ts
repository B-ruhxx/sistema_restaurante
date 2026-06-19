import api from './auth';

export const seguridadApi = {
  getSesiones: async (): Promise<any[]> => {
    const response = await api.get('/seguridad/sesiones');
    return response.data;
  }
};
