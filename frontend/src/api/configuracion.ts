import api from './auth';
import type { ApiSchemas } from './generated/openapi-types';

export interface ConfiguracionEmpresa extends Omit<ApiSchemas.ConfiguracionResponse, 'nombreEmpresa' | 'ruc' | 'igv'> {
  idConfiguracion?: number;
  nombreEmpresa: string;
  razonSocial?: string;
  ruc: string;
  logoUrl?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  moneda?: string;
  igv: number;
  serieBoleta?: string;
  serieFactura?: string;
}

export type ConfiguracionEmpresaRequest = ApiSchemas.ConfiguracionRequest;

export const configuracionApi = {
  get: async (): Promise<ConfiguracionEmpresa> => {
    const response = await api.get('/configuracion');
    return response.data;
  },

  update: async (data: ConfiguracionEmpresaRequest): Promise<ConfiguracionEmpresa> => {
    const response = await api.put('/configuracion', data);
    return response.data;
  },
};
