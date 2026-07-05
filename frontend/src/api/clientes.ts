import api from './auth';
import type { ApiSchemas } from './generated/openapi-types';

export const CLIENTE_TIPO_DOCUMENTO_VALUES = ['DNI', 'RUC', 'CE', 'PASAPORTE', 'SIN_DOCUMENTO'] as const;

export type ClienteTipoDocumento = (typeof CLIENTE_TIPO_DOCUMENTO_VALUES)[number];

export interface Cliente extends Omit<ApiSchemas.ClienteResponse, 'tipoDocumento' | 'estado'> {
  idCliente: number;
  nombre: string;
  apellido?: string;
  tipoDocumento?: ClienteTipoDocumento;
  documentoIdentidad?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface ClienteRequest extends Omit<ApiSchemas.ClienteRequest, 'tipoDocumento' | 'estado' | 'documentoIdentidad'> {
  nombre: string;
  apellido: string;
  tipoDocumento: ClienteTipoDocumento;
  documentoIdentidad: string | null;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export const clientesApi = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get('/clientes');
    return response.data;
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  create: async (data: ClienteRequest): Promise<Cliente> => {
    const response = await api.post('/clientes', data);
    return response.data;
  },

  update: async (id: number, data: ClienteRequest): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  }
};
