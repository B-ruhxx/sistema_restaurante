import api from './auth';

export interface Permiso {
  idPermiso: number;
  nombre: string;
  descripcion?: string;
}

export interface Rol {
  idRol: number;
  nombre: string;
  descripcion?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  permisos: Permiso[];
}

export interface RolRequest {
  nombre: string;
  descripcion?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  permisoIds: number[];
}

export const rolesApi = {
  getAll: async (): Promise<Rol[]> => {
    const response = await api.get('/roles');
    return response.data;
  },

  getById: async (id: number): Promise<Rol> => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  create: async (data: RolRequest): Promise<Rol> => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  update: async (id: number, data: RolRequest): Promise<Rol> => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  }
};
