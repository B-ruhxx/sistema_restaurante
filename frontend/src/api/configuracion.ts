import api from './auth';

export interface ConfiguracionEmpresa {
  idConfiguracion?: number;
  nombreEmpresa: string;
  razonSocial?: string;
  ruc?: string;
  logoUrl?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  moneda?: string;
  igv?: number;
  serieBoleta?: string;
  serieFactura?: string;
}

export const configuracionApi = {
  get: async (): Promise<ConfiguracionEmpresa> => {
    const response = await api.get('/configuracion');
    return response.data;
  },

  update: async (data: ConfiguracionEmpresa): Promise<ConfiguracionEmpresa> => {
    const response = await api.put('/configuracion', data);
    return response.data;
  },
};
