import api from './auth';

export interface MovimientoInventario {
  idMovimiento: number;
  tipoRecurso: 'INSUMO' | 'PRODUCTO';
  idInsumo?: number;
  nombreInsumo?: string;
  idProducto?: number;
  nombreProducto?: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'CONSUMO';
  origen: string;
  referenciaId?: number;
  cantidad: number;
  motivo?: string;
  fecha: string;
  idEmpleado?: number;
  nombreEmpleado?: string;
}

export const movimientosApi = {
  getAll: async (): Promise<MovimientoInventario[]> => {
    const response = await api.get('/inventario/movimientos');
    return response.data;
  },

  getByInsumo: async (idInsumo: number): Promise<MovimientoInventario[]> => {
    const response = await api.get(`/inventario/movimientos/insumo/${idInsumo}`);
    return response.data;
  },

  getByProducto: async (idProducto: number): Promise<MovimientoInventario[]> => {
    const response = await api.get(`/inventario/movimientos/producto/${idProducto}`);
    return response.data;
  },
};
