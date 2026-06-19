import api from './auth';

export interface Cliente {
  idCliente: number;
  nombre: string;
  apellido: string;
  tipoDocumento: 'DNI' | 'RUC' | 'CE';
  documentoIdentidad: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface ClienteRequest {
  nombre: string;
  apellido: string;
  tipoDocumento: 'DNI' | 'RUC' | 'CE';
  documentoIdentidad: string;
  telefono?: string;
  email?: string;
  direccion?: string;
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
