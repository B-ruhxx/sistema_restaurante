import api from './auth';
import type { ApiSchemas } from './generated/openapi-types';

export const inventoryMovementTypes = [
  'ENTRADA_COMPRA',
  'SALIDA_VENTA',
  'SALIDA_AJUSTE',
  'ENTRADA_ANULACION',
  'MERMA',
  'DEVOLUCION',
  'CORRECCION',
] as const;

export type InventoryMovementType = (typeof inventoryMovementTypes)[number];
export type InventoryMovementResourceType = 'INSUMO' | 'PRODUCTO';
export type InventoryMovementCategory = 'entrada' | 'salida' | 'correccion';

const inventoryMovementTypeSet = new Set<string>(inventoryMovementTypes);

export interface MovimientoInventario
  extends Omit<ApiSchemas.MovimientoInventarioResponse, 'tipoRecurso' | 'tipoMovimiento'> {
  tipoRecurso?: InventoryMovementResourceType;
  tipoMovimiento?: InventoryMovementType;
}

export interface AjusteInventarioRequest extends Omit<ApiSchemas.AjusteInventarioRequest, 'tipoRecurso'> {
  tipoRecurso: InventoryMovementResourceType;
}

export interface AjusteInventarioResponse
  extends Omit<ApiSchemas.AjusteInventarioResponse, 'tipoRecurso' | 'movimientos'> {
  tipoRecurso?: InventoryMovementResourceType;
  movimientos?: MovimientoInventario[];
}

const entryMovementTypes: readonly InventoryMovementType[] = [
  'ENTRADA_COMPRA',
  'ENTRADA_ANULACION',
];

const exitMovementTypes: readonly InventoryMovementType[] = [
  'SALIDA_VENTA',
  'SALIDA_AJUSTE',
  'MERMA',
];

const deltaDrivenMovementTypes: readonly InventoryMovementType[] = [
  'DEVOLUCION',
  'CORRECCION',
];

const movementLabelMap: Record<InventoryMovementType, string> = {
  ENTRADA_COMPRA: 'Compra',
  SALIDA_VENTA: 'Venta',
  SALIDA_AJUSTE: 'Ajuste',
  ENTRADA_ANULACION: 'Anulación',
  MERMA: 'Merma',
  DEVOLUCION: 'Devolución',
  CORRECCION: 'Corrección',
};

export function isInventoryMovementType(value?: string): value is InventoryMovementType {
  return value !== undefined && inventoryMovementTypeSet.has(value);
}

export function getInventoryMovementCategory(movimiento: MovimientoInventario): InventoryMovementCategory {
  if (!isInventoryMovementType(movimiento.tipoMovimiento)) {
    return 'correccion';
  }

  if (entryMovementTypes.includes(movimiento.tipoMovimiento)) {
    return 'entrada';
  }

  if (exitMovementTypes.includes(movimiento.tipoMovimiento)) {
    return 'salida';
  }

  if (deltaDrivenMovementTypes.includes(movimiento.tipoMovimiento)) {
    const direction = getCorrectionDirection(movimiento);

    if (direction > 0) {
      return 'entrada';
    }

    if (direction < 0) {
      return 'salida';
    }
  }

  return 'correccion';
}

export function getInventoryMovementLabel(tipoMovimiento?: string): string {
  if (!isInventoryMovementType(tipoMovimiento)) {
    return tipoMovimiento ?? 'Corrección';
  }

  return movementLabelMap[tipoMovimiento];
}

function getCorrectionDirection(movimiento: MovimientoInventario): number {
  const stockAnterior = Number(movimiento.stockAnterior ?? 0);
  const stockNuevo = Number(movimiento.stockNuevo ?? stockAnterior);
  const delta = stockNuevo - stockAnterior;

  if (delta > 0) {
    return 1;
  }

  if (delta < 0) {
    return -1;
  }

  return 0;
}

export function getInventoryMovementSignedQuantity(movimiento: MovimientoInventario): number {
  const quantity = Number(movimiento.cantidad ?? 0);
  const category = getInventoryMovementCategory(movimiento);

  if (category === 'entrada') {
    return quantity;
  }

  if (category === 'salida') {
    return -quantity;
  }

  return quantity * getCorrectionDirection(movimiento);
}

export function getInventoryMovementTotalCost(movimiento: MovimientoInventario): number {
  return Number(movimiento.cantidad ?? 0) * Number(movimiento.costoUnitario ?? 0);
}

export function getInventoryMovementSignedCost(movimiento: MovimientoInventario): number {
  const totalCost = getInventoryMovementTotalCost(movimiento);
  const category = getInventoryMovementCategory(movimiento);

  if (category === 'entrada') {
    return totalCost;
  }

  if (category === 'salida') {
    return -totalCost;
  }

  return totalCost * getCorrectionDirection(movimiento);
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

  ajustar: async (data: AjusteInventarioRequest): Promise<AjusteInventarioResponse> => {
    const response = await api.post('/inventario/ajustes', data);
    return response.data;
  },
};
