import api from './auth';

export interface Proveedor {
  idProveedor: number;
  razonSocial: string;
  ruc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  estado?: string;
}

export interface ProveedorRequest {
  razonSocial: string;
  ruc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  estado?: string;
}

export const proveedoresApi = {
  getAll: async (): Promise<Proveedor[]> => {
    const response = await api.get('/proveedores');
    return response.data;
  },

  getById: async (id: number): Promise<Proveedor> => {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  },

  create: async (data: ProveedorRequest): Promise<Proveedor> => {
    const response = await api.post('/proveedores', data);
    return response.data;
  },

  update: async (id: number, data: ProveedorRequest): Promise<Proveedor> => {
    const response = await api.put(`/proveedores/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/proveedores/${id}`);
  },
};
