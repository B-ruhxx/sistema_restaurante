import api from './auth';
import type { ApiSchemas } from './generated/openapi-types';

export interface VentaPagoRequest extends Omit<ApiSchemas.VentaPagoRequest, 'idMetodoPago' | 'monto' | 'referencia'> {
  idMetodoPago: number;
  monto: number;
  referencia?: string;
}

export interface VentaRequest extends Omit<ApiSchemas.VentaRequest, 'tipoComprobante' | 'pagos'> {
  tipoComprobante: 'BOLETA' | 'FACTURA' | 'TICKET';
  pagos: VentaPagoRequest[];
}

export interface DetalleVenta extends Omit<ApiSchemas.DetalleVentaResponse, 'idDetalle' | 'cantidad' | 'precioUnitario' | 'subtotal'> {
  idDetalle: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaPago extends Omit<ApiSchemas.VentaPagoResponse, 'idVentaPago' | 'nombreMetodoPago' | 'monto' | 'estado' | 'referencia'> {
  idVentaPago: number;
  nombreMetodoPago: string;
  monto: number;
  referencia?: string;
  estado: string;
}

export interface Venta extends Omit<ApiSchemas.VentaResponse, 'idVenta' | 'comprobante' | 'fecha' | 'subtotal' | 'igv' | 'total' | 'tipoComprobante' | 'estado' | 'cajeroNombre' | 'idCaja' | 'detalles' | 'pagos'> {
  idVenta: number;
  comprobante?: string;
  fecha: string;
  subtotal: number;
  igv: number;
  total: number;
  tipoComprobante: 'BOLETA' | 'FACTURA' | 'TICKET';
  serie?: string;
  numero?: string;
  estado: 'EMITIDA' | 'ANULADA';
  cajeroNombre: string;
  idCaja: number;
  detalles?: DetalleVenta[];
  pagos?: VentaPago[];
}

export const ventasApi = {
  getAll: async (): Promise<Venta[]> => {
    const response = await api.get('/ventas');
    return response.data;
  },

  getById: async (id: number): Promise<Venta> => {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  },

  create: async (data: VentaRequest): Promise<Venta> => {
    const response = await api.post('/ventas', data);
    return response.data;
  },

  pagar: async (id: number, pagos: VentaPagoRequest[]): Promise<Venta> => {
    const response = await api.post(`/ventas/${id}/pagar`, pagos);
    return response.data;
  },

  anular: async (id: number, motivo: string): Promise<Venta> => {
    const response = await api.post(`/ventas/${id}/anular`, { motivo });
    return response.data;
  }
};
