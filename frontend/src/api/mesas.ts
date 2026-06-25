import api from './auth';

export type MesaEstado = 'LIBRE' | 'OCUPADA' | 'ESPERANDO_COCINA' | 'SERVIDO' | 'CUENTA_EMITIDA' | 'PAGADA';

export interface Mesa {
  idMesa: number;
  numero: string;
  nombre?: string;
  capacidad: number;
  ubicacion?: string;
  estado: MesaEstado;
}

export interface MesaRequest {
  numero: string;
  nombre?: string;
  capacidad?: number;
  ubicacion?: string;
  estado?: MesaEstado;
}

export const mesasApi = {
  getAll: async (): Promise<Mesa[]> => {
    const response = await api.get('/mesas');
    return response.data;
  },
  getDisponibles: async (): Promise<Mesa[]> => {
    const response = await api.get('/mesas/disponibles');
    return response.data;
  },
  getById: async (id: number): Promise<Mesa> => {
    const response = await api.get(`/mesas/${id}`);
    return response.data;
  },
  create: async (data: MesaRequest): Promise<Mesa> => {
    const response = await api.post('/mesas', data);
    return response.data;
  },
  update: async (id: number, data: MesaRequest): Promise<Mesa> => {
    const response = await api.put(`/mesas/${id}`, data);
    return response.data;
  },
  updateEstado: async (id: number, estado: MesaEstado): Promise<Mesa> => {
    const response = await api.patch(`/mesas/${id}/estado`, { estado });
    return response.data;
  },
  liberar: async (id: number): Promise<Mesa> => {
    const response = await api.post(`/mesas/${id}/liberar`);
    return response.data;
  },
};
