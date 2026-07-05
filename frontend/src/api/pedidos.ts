import api from './auth';

export interface DetallePedidoRequest {
  idProducto?: number;
  idCombo?: number;
  cantidad: number;
  observacion?: string;
  extrasIds?: number[];
}

export interface PedidoRequest {
  idCliente?: number;
  idMesa?: number;
  detalles: DetallePedidoRequest[];
}

export interface AbrirPedidoMesaRequest {
  idCliente?: number | null;
}

export interface PedidoCancelacionRequest {
  motivo: string;
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
  estadoCocina?: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'CANCELADO';
  tiempoEstimadoMinutos?: number;
  tiempoRealMinutos?: number;
  fechaInicioPreparacion?: string;
  fechaFinPreparacion?: string;
  extras?: ExtraResponse[];
}

export type PedidoEstado =
  | 'BORRADOR_ATENCION'
  | 'EN_COCINA'
  | 'LISTO'
  | 'SERVIDO'
  | 'CUENTA'
  | 'CERRADO'
  | 'CANCELADO'
;

export interface Pedido {
  idPedido: number;
  empleadoNombre: string;
  clienteNombre?: string;
  clienteTipoDocumento?: 'DNI' | 'RUC' | 'CE';
  clienteDocumentoIdentidad?: string;
  idCliente?: number;
  idMesa?: number;
  numeroMesa?: string;
  estadoMesa?: string;
  estado: PedidoEstado;
  fecha: string;
  subtotal?: number;
  igv?: number;
  total?: number;
  fechaEnvioCocina?: string;
  fechaInicioPreparacion?: string;
  fechaFinPreparacion?: string;
  tiempoEstimadoMinutos?: number;
  tiempoRealMinutos?: number;
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

  createForMesa: async (idMesa: number, data: AbrirPedidoMesaRequest = {}): Promise<Pedido> => {
    const response = await api.post(`/pedidos/mesa/${idMesa}`, data);
    return response.data;
  },

  getActivoPorMesa: async (idMesa: number): Promise<Pedido | null> => {
    const response = await api.get(`/pedidos/mesa/${idMesa}/activo`);
    if (response.status === 204 || !response.data) return null;
    return response.data;
  },

  assignCliente: async (idPedido: number, idCliente: number): Promise<Pedido> => {
    const response = await api.put(`/pedidos/${idPedido}/cliente/${idCliente}`);
    return response.data;
  },

  addDetalle: async (idPedido: number, data: DetallePedidoRequest): Promise<DetallePedido> => {
    const response = await api.post(`/pedidos/${idPedido}/detalles`, data);
    return response.data;
  },

  enviarCocina: async (idPedido: number): Promise<Pedido> => {
    const response = await api.post(`/pedidos/${idPedido}/enviar-cocina`);
    return response.data;
  },
  cancelar: async (idPedido: number, data: PedidoCancelacionRequest): Promise<Pedido> => {
    const response = await api.post(`/pedidos/${idPedido}/cancelar`, data);
    return response.data;
  },

  reabrir: async (idPedido: number): Promise<Pedido> => {
    const response = await api.post(`/pedidos/${idPedido}/reabrir`);
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
