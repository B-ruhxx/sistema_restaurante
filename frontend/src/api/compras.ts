import api from './auth';

export interface DetalleCompraRequest {
  idInsumo: number;
  cantidad: number;
  precioUnitario: number;
}

export interface CompraRequest {
  codigoCompra?: string;
  idProveedor: number;
  detalles: DetalleCompraRequest[];
  observacion?: string;
}

export interface DetalleCompraResponse {
  idDetalleCompra: number;
  idInsumo: number;
  nombreInsumo: string;
  unidadInsumo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CompraResponse {
  idCompra: number;
  codigoCompra: string;
  idProveedor: number;
  proveedorNombre: string;
  empleadoNombre: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: string;
  fecha: string;
  observacion?: string;
  detalles: DetalleCompraResponse[];
}

export const comprasApi = {
  getAll: async (): Promise<CompraResponse[]> => {
    const response = await api.get('/compras');
    return response.data;
  },

  getById: async (id: number): Promise<CompraResponse> => {
    const response = await api.get(`/compras/${id}`);
    return response.data;
  },

  create: async (data: CompraRequest): Promise<CompraResponse> => {
    const response = await api.post('/compras', data);
    return response.data;
  },

  anular: async (id: number): Promise<CompraResponse> => {
    const response = await api.post(`/compras/${id}/anular`);
    return response.data;
  }
};
