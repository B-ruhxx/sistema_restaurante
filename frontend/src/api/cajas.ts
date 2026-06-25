import api from './auth';
import { Pedido } from './pedidos';
import { Venta, VentaPagoRequest } from './ventas';

export interface CajaResponse {
  idCaja: number;
  empleadoNombre: string;
  montoApertura: number;
  montoCierre?: number;
  montoVentas?: number;
  montoIngresos?: number;
  montoEgresos?: number;
  saldoEsperado?: number;
  fechaApertura: string;
  fechaCierre?: string;
  estado: 'ABIERTA' | 'CERRADA';
  observacionApertura?: string;
  observacionCierre?: string;
}

export interface MovimientoCajaRequest {
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
}

export interface MovimientoCajaResponse {
  idMovimientoCaja: number;
  idCaja: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  fecha: string;
}

export interface CobrarPedidoRequest {
  tipoComprobante: 'BOLETA' | 'FACTURA';
  serie?: string;
  correlativo?: string;
  pagos: VentaPagoRequest[];
}

export const cajasApi = {
  abrir: async (montoApertura: number, observacion?: string): Promise<CajaResponse> => {
    const response = await api.post('/cajas/abrir', { montoApertura, observacion });
    return response.data;
  },

  cerrar: async (id: number, montoCierre: number, observacion?: string): Promise<CajaResponse> => {
    const response = await api.post(`/cajas/cerrar/${id}`, { montoCierre, observacion });
    return response.data;
  },

  registrarMovimiento: async (idCaja: number, data: MovimientoCajaRequest): Promise<MovimientoCajaResponse> => {
    const response = await api.post(`/cajas/${idCaja}/movimientos`, data);
    return response.data;
  },

  getMovimientos: async (idCaja: number): Promise<MovimientoCajaResponse[]> => {
    const response = await api.get(`/cajas/${idCaja}/movimientos`);
    return response.data;
  },

  getActiva: async (): Promise<CajaResponse | null> => {
    try {
      const response = await api.get('/cajas/activa');
      if (response.status === 204 || !response.data) return null;
      return response.data;
    } catch {
      return null;
    }
  },

  getHistorial: async (): Promise<CajaResponse[]> => {
    const response = await api.get('/cajas/historial');
    return response.data;
  },

  getPedidosPendientes: async (): Promise<Pedido[]> => {
    const response = await api.get('/cajas/pedidos-pendientes');
    return response.data;
  },

  getPedidosPorMesa: async (idMesa: number): Promise<Pedido[]> => {
    const response = await api.get(`/cajas/pedidos/mesa/${idMesa}`);
    return response.data;
  },

  buscarPedidos: async (query: string): Promise<Pedido[]> => {
    const response = await api.get('/cajas/pedidos/buscar', { params: { query } });
    return response.data;
  },

  cobrarPedido: async (idPedido: number, data: CobrarPedidoRequest): Promise<Venta> => {
    const response = await api.post(`/cajas/pedidos/${idPedido}/cobrar`, data);
    return response.data;
  },
};
