const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';
const username = process.env.API_USERNAME || 'admin';
const password = process.env.API_PASSWORD || 'admin123';

const stamp = Date.now();
const result = {
  created: {},
  checks: [],
};

function check(name, condition, detail = '') {
  result.checks.push({ name, ok: Boolean(condition), detail });
  if (!condition) {
    throw new Error(`${name}${detail ? `: ${detail}` : ''}`);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = body?.message || text || response.statusText;
    const error = new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${message}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function requestExpectFailure(path, options, expectedMessagePart) {
  try {
    await request(path, options);
  } catch (error) {
    const message = error.body?.message || error.message || '';
    if (!expectedMessagePart || message.includes(expectedMessagePart)) {
      return { status: error.status, message };
    }
    throw new Error(`Fallo esperado con mensaje "${expectedMessagePart}", recibido: ${message}`);
  }
  throw new Error(`Se esperaba fallo en ${options.method || 'GET'} ${path}`);
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function idFromProductDetail(detail) {
  return detail?.producto?.idProducto || detail?.idProducto;
}

async function main() {
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const token = login.token;
  check('login admin', Boolean(token), 'token ausente');

  const headers = authHeaders(token);

  let cajaActiva = null;
  try {
    cajaActiva = await request('/cajas/activa', { headers });
  } catch {
    cajaActiva = null;
  }
  if (!cajaActiva?.idCaja) {
    cajaActiva = await request('/cajas/abrir', {
      method: 'POST',
      headers,
      body: JSON.stringify({ montoApertura: 100, observacion: `Validacion Fase 12 ${stamp}` }),
    });
  }
  result.created.caja = cajaActiva.idCaja;

  const categoria = await request('/categorias', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: `F12 Cat ${stamp}`.slice(0, 50),
      descripcion: 'Categoria temporal para validacion Fase 12',
      estado: 'ACTIVO',
    }),
  });
  result.created.categoria = categoria.idCategoria;

  const proveedor = await request('/proveedores', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      razonSocial: `Proveedor F12 ${stamp}`,
      ruc: String(stamp).slice(0, 11),
      estado: 'ACTIVO',
    }),
  });
  result.created.proveedor = proveedor.idProveedor;

  const metodoPago = await request('/metodo-pagos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: `EFECTIVO F12 ${String(stamp).slice(-6)}`,
      requiereOperacion: false,
      afectaCaja: true,
      estado: 'ACTIVO',
    }),
  });
  result.created.metodoPago = metodoPago.idMetodoPago;

  const parentDetail = await request('/productos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: `Bebida Padre F12 ${stamp}`,
      descripcion: 'Producto padre sin stock propio para validacion Fase 12',
      precio: 0,
      tipoProducto: 'INVENTARIO_DIRECTO',
      estado: 'ACTIVO',
      idCategoria: categoria.idCategoria,
      esSku: false,
      stockMinimo: 0,
    }),
  });
  const parentId = idFromProductDetail(parentDetail);
  result.created.parent = parentId;

  const skuA = await request('/productos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: `Bebida SKU A F12 ${stamp}`,
      descripcion: 'SKU vendido en validacion FIFO',
      precio: 10,
      tipoProducto: 'INVENTARIO_DIRECTO',
      estado: 'ACTIVO',
      idCategoria: categoria.idCategoria,
      esSku: true,
      idProductoPadre: parentId,
      sku: `F12-A-${stamp}`,
      stockMinimo: 0,
    }),
  });
  const skuAId = idFromProductDetail(skuA);
  result.created.skuA = skuAId;

  const skuB = await request('/productos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: `Bebida SKU B F12 ${stamp}`,
      descripcion: 'Segundo SKU hijo para validar catalogo padre',
      precio: 12,
      tipoProducto: 'INVENTARIO_DIRECTO',
      estado: 'ACTIVO',
      idCategoria: categoria.idCategoria,
      esSku: true,
      idProductoPadre: parentId,
      sku: `F12-B-${stamp}`,
      stockMinimo: 0,
    }),
  });
  const skuBId = idFromProductDetail(skuB);
  result.created.skuB = skuBId;

  const parentPurchaseFailure = await requestExpectFailure('/compras', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      codigoCompra: `F12-PARENT-${stamp}`,
      idProveedor: proveedor.idProveedor,
      detalles: [{
        idProducto: parentId,
        cantidad: 1,
        precioUnitario: 5,
        fechaVencimiento: '2026-12-31',
      }],
      observacion: 'Debe fallar: compra contra padre',
    }),
  }, 'producto padre');
  result.parentPurchaseFailure = parentPurchaseFailure.message;

  const parentAdjustmentFailure = await requestExpectFailure('/inventario/ajuste', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tipoRecurso: 'PRODUCTO',
      idProducto: parentId,
      cantidad: 1,
      motivo: 'Debe fallar: ajuste contra padre',
    }),
  }, 'producto padre');
  result.parentAdjustmentFailure = parentAdjustmentFailure.message;

  const compraLote1 = await request('/compras', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      codigoCompra: `F12-L1-${stamp}`,
      idProveedor: proveedor.idProveedor,
      detalles: [{
        idProducto: skuAId,
        cantidad: 5,
        precioUnitario: 4,
        fechaVencimiento: '2026-07-10',
      }],
      observacion: 'Lote FIFO temprano Fase 12',
    }),
  });
  const compraLote2 = await request('/compras', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      codigoCompra: `F12-L2-${stamp}`,
      idProveedor: proveedor.idProveedor,
      detalles: [{
        idProducto: skuAId,
        cantidad: 7,
        precioUnitario: 4,
        fechaVencimiento: '2026-08-10',
      }],
      observacion: 'Lote FIFO tardio Fase 12',
    }),
  });
  result.created.compras = [compraLote1.idCompra, compraLote2.idCompra].filter(Boolean);

  const lotesIniciales = await request(`/productos/${skuAId}/lotes`, { headers });
  const loteTempranoInicial = lotesIniciales.find(lote => lote.fechaVencimiento === '2026-07-10');
  const loteTardioInicial = lotesIniciales.find(lote => lote.fechaVencimiento === '2026-08-10');
  check('lote temprano creado con 5', Number(loteTempranoInicial?.cantidadDisponible) === 5, JSON.stringify(lotesIniciales));
  check('lote tardio creado con 7', Number(loteTardioInicial?.cantidadDisponible) === 7, JSON.stringify(lotesIniciales));

  const parentSaleFailure = await requestExpectFailure('/pedidos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      detalles: [{ idProducto: parentId, cantidad: 1 }],
    }),
  }, 'producto padre');
  result.parentSaleFailure = parentSaleFailure.message;

  const pedido = await request('/pedidos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      detalles: [{ idProducto: skuAId, cantidad: 6, observacion: 'Validacion FIFO Fase 12' }],
    }),
  });
  result.created.pedido = pedido.idPedido;
  check('pedido usa SKU operativo', pedido.detalles?.[0]?.idProducto === skuAId, JSON.stringify(pedido.detalles));
  check('precio de pedido viene del SKU', Number(pedido.detalles?.[0]?.precioUnitario) === 10, JSON.stringify(pedido.detalles));

  const venta = await request('/ventas', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      idPedido: pedido.idPedido,
      tipoComprobante: 'BOLETA',
      serie: 'B012',
      correlativo: String(stamp).slice(-8),
      pagos: [{ idMetodoPago: metodoPago.idMetodoPago, monto: 60, montoRecibido: 60 }],
    }),
  });
  result.created.ventaPendiente = venta.idVenta;

  const ventaPagada = await request(`/ventas/${venta.idVenta}/pagar`, {
    method: 'POST',
    headers,
    body: JSON.stringify([{ idMetodoPago: metodoPago.idMetodoPago, monto: 60, montoRecibido: 60 }]),
  });
  result.created.ventaPagada = ventaPagada.idVenta;
  check('venta queda pagada', ventaPagada.estado === 'PAGADA', ventaPagada.estado);

  const lotesPostVenta = await request(`/productos/${skuAId}/lotes`, { headers });
  const loteTempranoPostVenta = lotesPostVenta.find(lote => lote.fechaVencimiento === '2026-07-10');
  const loteTardioPostVenta = lotesPostVenta.find(lote => lote.fechaVencimiento === '2026-08-10');
  check('FIFO consume lote temprano completo', Number(loteTempranoPostVenta?.cantidadDisponible) === 0, JSON.stringify(lotesPostVenta));
  check('FIFO consume una unidad del lote tardio', Number(loteTardioPostVenta?.cantidadDisponible) === 6, JSON.stringify(lotesPostVenta));

  const ventaAnulada = await request(`/ventas/${venta.idVenta}/anular`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ motivo: `Validacion devolucion lote F12 ${stamp}` }),
  });
  check('venta queda anulada', ventaAnulada.estado === 'ANULADA', ventaAnulada.estado);

  const lotesPostAnulacion = await request(`/productos/${skuAId}/lotes`, { headers });
  const loteTempranoPostAnulacion = lotesPostAnulacion.find(lote => lote.fechaVencimiento === '2026-07-10');
  const loteTardioPostAnulacion = lotesPostAnulacion.find(lote => lote.fechaVencimiento === '2026-08-10');
  check('anulacion devuelve lote temprano', Number(loteTempranoPostAnulacion?.cantidadDisponible) === 5, JSON.stringify(lotesPostAnulacion));
  check('anulacion devuelve lote tardio', Number(loteTardioPostAnulacion?.cantidadDisponible) === 7, JSON.stringify(lotesPostAnulacion));

  const parentDetailAfter = await request(`/productos/${parentId}`, { headers });
  check('padre reporta SKUs hijos', parentDetailAfter.producto?.tieneSkus === true, JSON.stringify(parentDetailAfter.producto));
  check('padre reporta stock agregado', Number(parentDetailAfter.producto?.stockTotal) >= 12, JSON.stringify(parentDetailAfter.producto));

  nodeReplSafeWrite(result);
}

function nodeReplSafeWrite(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
