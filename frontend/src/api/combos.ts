import api from './auth';

export interface ComboDetalle {
  idComboDetalle?: number;
  idProducto: number;
  nombreProducto?: string;
  precioProducto?: number;
  cantidad: number;
}

export interface Combo {
  idCombo: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagenUrl?: string;
  etiqueta?: string;
  validoHasta?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  detalles: ComboDetalle[];
}

export interface ComboRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  imagenUrl?: string;
  etiqueta?: string;
  validoHasta?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  detalles: {
    idProducto: number;
    cantidad: number;
  }[];
}

export const combosApi = {
  getAll: async (): Promise<Combo[]> => {
    const response = await api.get('/combos');
    return response.data;
  },

  getById: async (id: number): Promise<Combo> => {
    const response = await api.get(`/combos/${id}`);
    return response.data;
  },

  create: async (data: ComboRequest): Promise<Combo> => {
    const response = await api.post('/combos', data);
    return response.data;
  },

  update: async (id: number, data: ComboRequest): Promise<Combo> => {
    const response = await api.put(`/combos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/combos/${id}`);
  }
};
