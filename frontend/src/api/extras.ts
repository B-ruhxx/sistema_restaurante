import api from './auth';

export interface ExtraProducto {
  idExtra: number;
  nombre: string;
  precio: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface ExtraProductoRequest {
  nombre: string;
  precio: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export const extrasApi = {
  getAll: async (): Promise<ExtraProducto[]> => {
    const response = await api.get('/extras');
    return response.data;
  },

  getById: async (id: number): Promise<ExtraProducto> => {
    const response = await api.get(`/extras/${id}`);
    return response.data;
  },

  create: async (data: ExtraProductoRequest): Promise<ExtraProducto> => {
    const response = await api.post('/extras', data);
    return response.data;
  },

  update: async (id: number, data: ExtraProductoRequest): Promise<ExtraProducto> => {
    const response = await api.put(`/extras/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/extras/${id}`);
  }
};
