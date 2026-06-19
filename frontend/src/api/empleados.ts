import api from './auth';

export interface Empleado {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  username: string;
  telefono?: string;
  email?: string;
  avatarUrl?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  idRol: number;
  nombreRol: string;
}

export interface EmpleadoRequest {
  nombre: string;
  apellido: string;
  username: string;
  password?: string;
  telefono?: string;
  email?: string;
  avatarUrl?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  idRol: number;
}

export const empleadosApi = {
  getAll: async (): Promise<Empleado[]> => {
    const response = await api.get('/empleados');
    return response.data;
  },

  getById: async (id: number): Promise<Empleado> => {
    const response = await api.get(`/empleados/${id}`);
    return response.data;
  },

  create: async (data: EmpleadoRequest): Promise<Empleado> => {
    const response = await api.post('/empleados', data);
    return response.data;
  },

  update: async (id: number, data: EmpleadoRequest): Promise<Empleado> => {
    const response = await api.put(`/empleados/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/empleados/${id}`);
  },

  getRoles: async (): Promise<any[]> => {
    const response = await api.get('/empleados/roles');
    return response.data;
  }
};
