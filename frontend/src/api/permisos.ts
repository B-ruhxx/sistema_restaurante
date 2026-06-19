import api from './auth';
import { Permiso } from './roles';

export const permisosApi = {
  getAll: async (): Promise<Permiso[]> => {
    const response = await api.get('/permisos');
    return response.data;
  }
};
