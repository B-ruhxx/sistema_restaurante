import { expect, type APIRequestContext } from 'playwright/test';

export type SeedContext = {
  runId: string;
  category: { idCategoria: number; nombre: string };
  insumo: { idInsumo: number; nombre: string };
  posParentProduct: { idProducto: number; nombre: string };
  posSkuProduct: { idProducto: number; nombre: string; sku?: string };
  purchaseParentProduct: { idProducto: number; nombre: string };
  purchaseSkuProduct: { idProducto: number; nombre: string; sku?: string };
  supplier: { idProveedor: number; razonSocial: string };
  table: { idMesa: number; numero: string };
  paymentMethod: { idMetodoPago: number; nombre: string; codigo: string };
};

export async function ensureSeedData(api: APIRequestContext, runId: string): Promise<SeedContext> {
  const suffix = runId.slice(-8);

  const category = await createJson(api, '/categorias', {
    nombre: `E2E Categoria ${suffix}`,
    descripcion: `Categoria E2E ${runId}`,
    estado: 'ACTIVO',
  });

  const insumo = await createJson(api, '/insumos', {
    nombre: `E2E Insumo ${suffix}`,
    unidad: 'UND',
    stock: 500,
    stockMinimo: 10,
    costoPromedio: 1.5,
    estado: 'ACTIVO',
  });

  const posParentProduct = await createJson(api, '/productos/padres', {
    nombre: `E2E POS Padre ${suffix}`,
    descripcion: `Producto preparado ${runId}`,
    estado: 'ACTIVO',
    idCategoria: category.idCategoria,
    esSku: false,
  });

  const posSkuProduct = await createJson(api, `/productos/${posParentProduct.producto.idProducto}/skus`, {
    nombre: `E2E POS SKU ${suffix}`,
    descripcion: `SKU preparado ${runId}`,
    precio: 18.5,
    tipoProducto: 'PREPARADO',
    estado: 'ACTIVO',
    idCategoria: category.idCategoria,
    esSku: true,
    sku: `E2EPOS-${suffix}`,
    stockMinimo: 1,
    tiempoPreparacionMinutos: 10,
    receta: [
      {
        idInsumo: insumo.idInsumo,
        cantidad: 1,
      },
    ],
  });

  const purchaseParentProduct = await createJson(api, '/productos/padres', {
    nombre: `E2E Compra Padre ${suffix}`,
    descripcion: `Producto inventariable ${runId}`,
    estado: 'ACTIVO',
    idCategoria: category.idCategoria,
    esSku: false,
  });

  const purchaseSkuProduct = await createJson(api, `/productos/${purchaseParentProduct.producto.idProducto}/skus`, {
    nombre: `E2E Compra SKU ${suffix}`,
    descripcion: `SKU inventariable ${runId}`,
    precio: 7.5,
    tipoProducto: 'INVENTARIO_DIRECTO',
    estado: 'ACTIVO',
    idCategoria: category.idCategoria,
    esSku: true,
    sku: `E2ECOMP-${suffix}`,
    stockMinimo: 1,
  });

  const supplier = await createJson(api, '/proveedores', {
    razonSocial: `E2E Proveedor ${suffix}`,
    ruc: `20${suffix.padStart(9, '0').slice(0, 9)}`,
    contacto: 'QA E2E',
    telefono: '999888777',
    email: `e2e-${suffix}@example.test`,
    direccion: `Calle E2E ${suffix}`,
    estado: 'ACTIVO',
  });

  const table = await createJson(api, '/mesas', {
    numero: `9${suffix.slice(-2)}`,
    nombre: `Mesa E2E ${suffix}`,
    capacidad: 4,
    ubicacion: `Zona E2E ${suffix}`,
    estado: 'DISPONIBLE',
  });

  const paymentMethod = await ensurePaymentMethod(api, suffix);

  return {
    runId,
    category,
    insumo,
    posParentProduct: posParentProduct.producto,
    posSkuProduct: posSkuProduct.producto,
    purchaseParentProduct: purchaseParentProduct.producto,
    purchaseSkuProduct: purchaseSkuProduct.producto,
    supplier,
    table,
    paymentMethod,
  };
}

export async function ensureCajaCerrada(api: APIRequestContext) {
  const response = await api.get(withApiBase('/cajas/activa'));
  if (response.status() === 204) {
    return;
  }
  expect(response.ok(), `No se pudo consultar la caja activa: ${response.status()}`).toBeTruthy();
  const activeCaja = await response.json();
  if (!activeCaja?.idCaja) {
    return;
  }

  const montoCierre = Number(activeCaja.saldoEsperado ?? activeCaja.montoApertura ?? 0);
  const closeResponse = await api.post(withApiBase(`/cajas/cerrar/${activeCaja.idCaja}`), {
    data: {
      montoCierre,
      observacion: 'Cierre tecnico E2E previo a auditoria.',
    },
  });
  expect(closeResponse.ok(), `No se pudo cerrar la caja previa: ${closeResponse.status()}`).toBeTruthy();
}

export async function markPedidoListo(api: APIRequestContext, idPedido: number) {
  const response = await api.put(withApiBase(`/pedidos/${idPedido}/estado`), {
    data: { estado: 'LISTO' },
  });
  expect(response.ok(), `No se pudo marcar pedido ${idPedido} como LISTO`).toBeTruthy();
}

async function ensurePaymentMethod(api: APIRequestContext, suffix: string) {
  const existingResponse = await api.get(withApiBase('/metodo-pagos/activos'));
  expect(existingResponse.ok(), 'No se pudo listar metodos de pago').toBeTruthy();
  const methods = await existingResponse.json();
  const efectivo = methods.find((method: { codigo?: string }) => method.codigo?.trim().toUpperCase() === 'EFECTIVO');
  if (efectivo) return efectivo;

  return createJson(api, '/metodo-pagos', {
    nombre: `Efectivo E2E ${suffix}`,
    codigo: 'EFECTIVO',
    requiereReferencia: false,
    estado: 'ACTIVO',
  });
}

async function createJson(api: APIRequestContext, url: string, data: Record<string, unknown>) {
  const response = await api.post(withApiBase(url), { data });
  expect(response.ok(), `No se pudo crear ${url}: ${response.status()} ${await response.text()}`).toBeTruthy();
  return response.json();
}

function withApiBase(url: string) {
  return url.replace(/^\//, '');
}
