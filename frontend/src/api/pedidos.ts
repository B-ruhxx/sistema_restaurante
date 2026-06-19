import api from './auth';

export interface DetallePedidoRequest {
  idProducto?: number;
  idCombo?: number;
  idVariante?: number;
  cantidad: number;
  observacion?: string;
  extrasIds?: number[];
}

export interface PedidoRequest {
  idCliente?: number;
  detalles: DetallePedidoRequest[];
}

export interface ExtraResponse {
  idExtra: number;
  nombre: string;
  precio: number;
}

export interface DetallePedido {
  idDetallePedido: number;
  idProducto?: number;
  nombreProducto?: string;
  idCombo?: number;
  nombreCombo?: string;
  idVariante?: number;
  nombreVariante?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
  extras?: ExtraResponse[];
}

export interface Pedido {
  idPedido: number;
  empleadoNombre: string;
  clienteNombre?: string;
  idCliente?: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
  fecha: string;
  detalles?: DetallePedido[];
}

export const pedidosApi = {
  getAll: async (): Promise<Pedido[]> => {
    const response = await api.get('/pedidos');
    return response.data;
  },

  getById: async (id: number): Promise<Pedido> => {
    const response = await api.get(`/pedidos/${id}`);
    return response.data;
  },

  create: async (data: PedidoRequest): Promise<Pedido> => {
    const response = await api.post('/pedidos', data);
    return response.data;
  },

  updateEstado: async (id: number, estado: string): Promise<Pedido> => {
    const response = await api.put(`/pedidos/${id}/estado`, { estado });
    return response.data;
  },

  getDetalles: async (id: number): Promise<DetallePedido[]> => {
    const response = await api.get(`/pedidos/${id}/detalles`);
    return response.data;
  }
};
