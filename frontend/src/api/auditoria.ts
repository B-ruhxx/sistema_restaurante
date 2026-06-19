import api from './auth';

export interface AuditoriaLog {
  idAuditoria: number;
  tablaAfectada: string;
  accion: string;
  idRegistro?: string;
  idEmpleado?: number;
  nombreEmpleado?: string;
  datosAnteriores?: string;
  datosNuevos?: string;
  fechaEvento: string;
}

export const auditoriaApi = {
  getAll: async (): Promise<AuditoriaLog[]> => {
    const response = await api.get('/auditoria');
    return response.data;
  },

  getByTabla: async (tabla: string): Promise<AuditoriaLog[]> => {
    const response = await api.get(`/auditoria/tabla/${tabla}`);
    return response.data;
  },
};
