import api from './auth';
import type { ApiSchemas } from './generated/openapi-types';

export interface AlertaStock extends Omit<ApiSchemas.AlertaStockDto, 'nombre' | 'stock' | 'stockMinimo'> {
  nombre: string;
  stock: number;
  stockMinimo: number;
}

export interface StockInsuficiente extends Omit<ApiSchemas.StockInsuficienteDto, 'producto' | 'insumo' | 'stock' | 'cantidad'> {
  producto: string;
  insumo: string;
  stock: number;
  cantidad: number;
}

export interface VentaDiaria extends Omit<ApiSchemas.VentaDiariaResponse, 'fecha' | 'total' | 'cantidad'> {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface CompraDiaria extends Omit<ApiSchemas.CompraDiariaResponse, 'fecha' | 'total' | 'cantidad'> {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface VentaPorHora extends Omit<ApiSchemas.VentaPorHoraResponse, 'hora' | 'etiqueta' | 'total' | 'cantidad'> {
  hora: number;
  etiqueta: string;
  total: number;
  cantidad: number;
}

export interface ProductoPopular extends Omit<ApiSchemas.ProductoPopularResponse, 'producto' | 'categoria' | 'cantidad' | 'total'> {
  producto: string;
  categoria: string;
  cantidad: number;
  total: number;
}

export interface ResumenFinanciero extends Omit<ApiSchemas.ResumenFinancieroResponse, 'totalVentas' | 'baseImponible' | 'igv' | 'costoTotal' | 'totalCompras' | 'gananciaNeta'> {
  totalVentas: number;
  baseImponible: number;
  igv: number;
  costoTotal: number;
  totalCompras: number;
  gananciaNeta: number;
}

export interface UtilidadDiaria {
  fecha: string;
  ventas: number;
  costo: number;
  utilidad: number;
}

export const reportesApi = {
  getAlertaStock: async (): Promise<AlertaStock[]> => {
    const response = await api.get('/reportes/alerta-stock');
    return response.data;
  },

  getStockInsuficiente: async (): Promise<StockInsuficiente[]> => {
    const response = await api.get('/reportes/stock-insuficiente');
    return response.data;
  },

  getVentasDiarias: async (): Promise<VentaDiaria[]> => {
    const response = await api.get('/reportes/ventas-diarias');
    return response.data;
  },

  getComprasDiarias: async (): Promise<CompraDiaria[]> => {
    const response = await api.get('/reportes/compras-diarias');
    return response.data;
  },

  getUtilidadDiaria: async (): Promise<UtilidadDiaria[]> => {
    const response = await api.get('/reportes/utilidad-diaria');
    return response.data;
  },

  getVentasPorHora: async (fecha?: string): Promise<VentaPorHora[]> => {
    const response = await api.get('/reportes/ventas-por-hora', { params: { fecha } });
    return response.data;
  },

  getProductosPopulares: async (): Promise<ProductoPopular[]> => {
    const response = await api.get('/reportes/productos-populares');
    return response.data;
  },

  getResumenFinanciero: async (): Promise<ResumenFinanciero> => {
    const response = await api.get('/reportes/resumen-financiero');
    return response.data;
  },
};
