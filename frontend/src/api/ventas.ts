import api from './auth';

export interface VentaPagoRequest {
  idMetodoPago: number;
  monto: number;
  numeroOperacion?: string;
}

export interface VentaRequest {
  idPedido?: number;
  tipoComprobante: 'BOLETA' | 'FACTURA';
  serie?: string;
  correlativo?: string;
  pagos: VentaPagoRequest[];
}

export interface DetalleVenta {
  idDetalle: number;
  idProducto?: number;
  nombreProducto?: string;
  idCombo?: number;
  nombreCombo?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaPago {
  idPago: number;
  metodoPagoNombre: string;
  monto: number;
  numeroOperacion?: string;
  estado: string;
}

export interface Venta {
  idVenta: number;
  codigoVenta: string;
  fecha: string;
  subtotal: number;
  subtotalGravado: number;
  igv: number;
  igvPorcentaje: number;
  total: number;
  tipoComprobante: 'BOLETA' | 'FACTURA';
  serie?: string;
  correlativo?: string;
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  idPedido?: number;
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
