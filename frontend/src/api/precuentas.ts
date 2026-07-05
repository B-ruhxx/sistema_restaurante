import api from './auth';
import { DetallePedido } from './pedidos';

export interface Precuenta {
  idPrecuenta: number;
  idPedido: number;
  idMesa?: number;
  numeroMesa?: string;
  numero: string;
  fechaEmision: string;
  emitidoPorNombre: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: 'EMITIDA' | 'CONVERTIDA_VENTA' | 'INVALIDADA_POR_ADICION';
  detalles?: DetallePedido[];
}

export const precuentasApi = {
  emitir: async (idPedido: number): Promise<Precuenta> => {
    const response = await api.post(`/pedidos/${idPedido}/precuentas`);
    return response.data;
  },
  getById: async (id: number): Promise<Precuenta> => {
    const response = await api.get(`/precuentas/${id}`);
    return response.data;
  },
  getByPedido: async (idPedido: number): Promise<Precuenta[]> => {
    const response = await api.get(`/precuentas/pedido/${idPedido}`);
    return response.data;
  },
};
