import api from './auth';

export interface SecurityAlert {
  id: string;
  tipo: 'warning' | 'error' | 'info';
  titulo: string;
  descripcion: string;
  fecha: string;
  usuario?: string;
}

export interface SecuritySession {
  id?: string;
  usuario?: string;
  dispositivo?: string;
  navegador?: string;
  ubicacion?: string;
  inicio?: string;
  logout?: string;
  ultimaActividad?: string;
  ip?: string;
  actual?: boolean;
}

export const seguridadApi = {
  getSesiones: async (): Promise<SecuritySession[]> => {
    const response = await api.get('/seguridad/sesiones');
    return response.data;
  },

  getAlertas: async (): Promise<SecurityAlert[]> => {
    const response = await api.get('/seguridad/alertas');
    return response.data;
  },

  resolverAlerta: async (id: string | number): Promise<SecurityAlert> => {
    const response = await api.post(`/seguridad/alertas/${id}/resolver`);
    return response.data;
  },

  cerrarSesion: async (id: string | number): Promise<void> => {
    await api.post(`/seguridad/sesiones/${id}/cerrar`);
  },
};
