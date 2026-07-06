import api from './auth';
import type { ApiSchemas } from './generated/openapi-types';

export interface ExtraProducto extends Omit<ApiSchemas.ExtraProductoResponse, 'idExtra' | 'nombre' | 'precio' | 'idInsumo' | 'cantidadConsumida' | 'estado'> {
  idExtra: number;
  nombre: string;
  precio: number | null;
  idInsumo: number;
  nombreInsumo?: string;
  unidadMedidaInsumo?: string;
  cantidadConsumida: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export type ExtraProductoRequest = ApiSchemas.ExtraProductoRequest;

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
