import { test, expect } from './fixtures/audit';
import { createApiContext, disposeApiContext } from './support/api';
import { ensureCajaCerrada, ensureSeedData, markPedidoListo, type SeedContext } from './support/data';

let seed: SeedContext;

test.beforeAll(async () => {
  const api = await createApiContext();
  try {
    seed = await ensureSeedData(api, `run-${Date.now()}`);
  } finally {
    await disposeApiContext(api);
  }
});

test('crear y editar producto', async ({ page, audit }) => {
  await page.goto('/productos');

  const productName = `E2E Producto UI ${seed.runId}`;
  const editedDescription = `Producto auditado ${seed.runId}`;
  const dialog = page.getByRole('dialog');

  await page.getByRole('button', { name: 'Nuevo Producto' }).click();
  await dialog.getByPlaceholder('Nombre del producto').fill(productName);
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: seed.category.nombre }).click();

  await audit.expectSuccess('crear producto desde formulario', async () => {
    await dialog.getByRole('button', { name: 'Crear producto' }).click();
  });

  await expect(page.getByText(productName).first()).toBeVisible({ timeout: 15_000 });
  await page.getByText(productName).first().click();
  await dialog.getByPlaceholder('Descripcion breve para la carta...').fill(editedDescription);

  await audit.expectSuccess('editar producto desde formulario', async () => {
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  });

  await expect(page.getByText(productName).first()).toBeVisible();
});

test('crear compra', async ({ page, audit }) => {
  await page.goto('/compras');
  const dialog = page.getByRole('dialog');

  await page.getByRole('button', { name: 'Nueva Compra' }).click();
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: new RegExp(seed.supplier.razonSocial) }).click();
  await dialog.getByPlaceholder('Observaciones...').fill(`Compra auditada ${seed.runId}`);
  await dialog.getByRole('button', { name: /Siguiente/ }).click();

  await dialog.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: 'SKU' }).click();
  await dialog.getByRole('combobox').nth(2).click();
  await page.getByRole('option', { name: new RegExp(seed.purchaseSkuProduct.nombre) }).click();
  await dialog.getByPlaceholder('Qty').fill('5');
  await dialog.getByPlaceholder('0.00').fill('8.75');
  await dialog.locator('input[type="date"]').fill('2035-12-31');
  await dialog.locator('button.h-9.w-9.rounded-xl.p-0').click();
  await dialog.getByRole('button', { name: /Siguiente/ }).click();

  await audit.expectSuccess('crear compra desde wizard', async () => {
    await dialog.getByRole('button', { name: 'Confirmar compra' }).click();
  });

  await expect(page.getByText(seed.supplier.razonSocial).first()).toBeVisible({ timeout: 15_000 });
});

test('crear pedido desde POS', async ({ page, audit }) => {
  await page.goto('/pos');

  await page.locator('select').selectOption(String(seed.table.idMesa));
  await page.getByText(seed.posParentProduct.nombre).first().click();
  await page.getByRole('tab', { name: new RegExp(seed.posSkuProduct.nombre) }).click();

  await audit.expectSuccess('agregar item en POS', async () => {
    await page.getByRole('button', { name: 'Agregar al pedido' }).click();
  });

  await expect(page.getByText(seed.posParentProduct.nombre).first()).toBeVisible();

  await audit.expectSuccess('enviar pedido a cocina desde POS', async () => {
    await page.getByRole('button', { name: /Enviar a Cocina/ }).click();
  });

  await expect(page.getByText(/Pedido #/)).toBeVisible({ timeout: 15_000 });
});

test('abrir caja y cobrar', async ({ page, audit }) => {
  const api = await createApiContext();
  try {
    await ensureCajaCerrada(api);
  } finally {
    await disposeApiContext(api);
  }

  await page.goto('/caja');
  await page.getByLabel('Saldo de apertura *').fill('300');

  await audit.expectSuccess('abrir caja desde formulario', async () => {
    await page.getByRole('button', { name: 'Abrir Caja' }).click();
  });

  await expect(page.getByText('Pedidos por cobrar')).toBeVisible({ timeout: 15_000 });

  await page.goto('/pos');
  await page.locator('select').selectOption(String(seed.table.idMesa));
  await page.getByText(seed.posParentProduct.nombre).first().click();
  await page.getByRole('tab', { name: new RegExp(seed.posSkuProduct.nombre) }).click();
  await page.getByRole('button', { name: 'Agregar al pedido' }).click();
  await page.getByRole('button', { name: /Enviar a Cocina/ }).click();
  await expect(page.getByText(/Pedido #/)).toBeVisible({ timeout: 15_000 });

  const pedidoTexto = await page.getByText(/Pedido #\d+/).innerText();
  const pedidoId = Number(pedidoTexto.match(/#(\d+)/)?.[1]);
  expect(pedidoId).toBeGreaterThan(0);

  const api2 = await createApiContext();
  try {
    await markPedidoListo(api2, pedidoId);
  } finally {
    await disposeApiContext(api2);
  }

  await page.getByRole('button', { name: 'Actualizar estado' }).click();
  await audit.expectSuccess('marcar pedido entregado desde POS', async () => {
    await page.getByRole('button', { name: /Marcar Entregado/ }).click();
  });

  await audit.expectSuccess('emitir precuenta desde POS', async () => {
    await page.getByRole('button', { name: /Emitir Precuenta/ }).click();
  });

  await expect(page).toHaveURL(/\/caja$/);
  await page.getByRole('button', { name: 'Cobrar' }).first().click();

  await audit.expectSuccess('cobrar pedido desde caja', async () => {
    await page.getByRole('button', { name: 'Confirmar cobro' }).click();
  });

  await expect(page.getByText(/cobrada correctamente/i)).toBeVisible({ timeout: 15_000 });
});

test('consultar Kardex', async ({ page, audit }) => {
  await page.goto('/kardex');
  await page.getByPlaceholder('Buscar insumo, referencia o lote...').fill(seed.purchaseSkuProduct.nombre);

  await audit.expectSuccess('consultar kardex filtrado', async () => {
    await page.waitForTimeout(500);
  });

  await expect(page.getByText(seed.purchaseSkuProduct.nombre).first()).toBeVisible({ timeout: 15_000 });
});
