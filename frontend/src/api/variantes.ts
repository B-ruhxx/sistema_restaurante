import api from './auth';

export interface VarianteProducto {
  idVariante: number;
  idProducto: number;
  nombreProducto?: string;
  nombre: string;
  descripcion?: string;
  precioExtra: number;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface VarianteProductoRequest {
  idProducto: number;
  nombre: string;
  descripcion?: string;
  precioExtra: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export const variantesApi = {
  getByProducto: async (idProducto: number): Promise<VarianteProducto[]> => {
    const response = await api.get(`/variantes/producto/${idProducto}`);
    return response.data;
  },

  create: async (data: VarianteProductoRequest): Promise<VarianteProducto> => {
    const response = await api.post('/variantes', data);
    return response.data;
  },

  update: async (id: number, data: VarianteProductoRequest): Promise<VarianteProducto> => {
    const response = await api.put(`/variantes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/variantes/${id}`);
  }
};
