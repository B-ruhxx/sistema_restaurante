import api from './auth';

export interface MetodoPago {
  idMetodoPago: number;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface MetodoPagoRequest {
  nombre: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export const metodoPagosApi = {
  getAll: async (): Promise<MetodoPago[]> => {
    const response = await api.get('/metodo-pagos');
    return response.data;
  },

  getActivos: async (): Promise<MetodoPago[]> => {
    const response = await api.get('/metodo-pagos/activos');
    return response.data;
  },

  getById: async (id: number): Promise<MetodoPago> => {
    const response = await api.get(`/metodo-pagos/${id}`);
    return response.data;
  },

  create: async (data: MetodoPagoRequest): Promise<MetodoPago> => {
    const response = await api.post('/metodo-pagos', data);
    return response.data;
  },

  update: async (id: number, data: MetodoPagoRequest): Promise<MetodoPago> => {
    const response = await api.put(`/metodo-pagos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/metodo-pagos/${id}`);
  }
};
