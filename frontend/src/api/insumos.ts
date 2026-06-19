import api from './auth';

export interface Insumo {
  idInsumo: number;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  costoPromedio: number;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface InsumoRequest {
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  costoPromedio?: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export const insumosApi = {
  getAll: async (): Promise<Insumo[]> => {
    const response = await api.get('/insumos');
    return response.data;
  },

  getById: async (id: number): Promise<Insumo> => {
    const response = await api.get(`/insumos/${id}`);
    return response.data;
  },

  create: async (data: InsumoRequest): Promise<Insumo> => {
    const response = await api.post('/insumos', data);
    return response.data;
  },

  update: async (id: number, data: InsumoRequest): Promise<Insumo> => {
    const response = await api.put(`/insumos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/insumos/${id}`);
  }
};
