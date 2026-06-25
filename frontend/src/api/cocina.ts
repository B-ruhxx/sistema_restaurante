import api from './auth';

export interface ComandaDetalle {
  idDetallePedido: number;
  itemNombre: string;
  varianteNombre?: string;
  cantidad: number;
  observacion?: string;
  extras?: string[];
  estadoCocina: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'CANCELADO';
  tiempoEstimadoMinutos?: number;
  tiempoRealMinutos?: number;
  fechaInicioPreparacion?: string;
  fechaFinPreparacion?: string;
}

export interface Comanda {
  idPedido: number;
  estado: string;
  idMesa?: number;
  numeroMesa?: string;
  clienteNombre?: string;
  fechaEnvioCocina?: string;
  fechaInicioPreparacion?: string;
  fechaFinPreparacion?: string;
  tiempoEstimadoMinutos?: number;
  tiempoRealMinutos?: number;
  detalles: ComandaDetalle[];
}

export const cocinaApi = {
  getComandas: async (): Promise<Comanda[]> => {
    const response = await api.get('/cocina/comandas');
    return response.data;
  },
  iniciar: async (idPedido: number): Promise<Comanda> => {
    const response = await api.post(`/cocina/pedidos/${idPedido}/iniciar`);
    return response.data;
  },
  finalizar: async (idPedido: number): Promise<Comanda> => {
    const response = await api.post(`/cocina/pedidos/${idPedido}/finalizar`);
    return response.data;
  },
  updateDetalleEstado: async (idDetalle: number, estado: ComandaDetalle['estadoCocina']): Promise<ComandaDetalle> => {
    const response = await api.patch(`/cocina/detalles/${idDetalle}/estado`, { estado });
    return response.data;
  },
};
