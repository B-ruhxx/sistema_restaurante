import { test, expect } from 'playwright/test';

const MOCK_USER = {
  idEmpleado: 1, nombre: 'Admin', email: 'admin@restaurante.com',
  rol: 'ADMINISTRADOR', permisos: ['ACCESO_TOTAL'],
};

const MOCK_PRODUCTOS = [
  { idProducto: 1, nombre: 'Pizza Clásica', descripcion: 'Pizza clasica', precio: null, tipoProducto: 'PREPARADO', tiempoPreparacionMinutos: 15, estado: 'ACTIVO', idCategoria: 1, nombreCategoria: 'Pizzas', esSku: false, tieneSkus: true },
  { idProducto: 2, nombre: 'Familiar', precio: 45, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 1, nombreCategoria: 'Pizzas', esSku: true, idProductoPadre: 1, nombreProductoPadre: 'Pizza Clásica', sku: 'PIZ-FAM', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 3, nombre: 'Personal', precio: null, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 1, nombreCategoria: 'Pizzas', esSku: true, idProductoPadre: 1, nombreProductoPadre: 'Pizza Clásica', sku: 'PIZ-PER', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 4, nombre: 'Bebida Misteriosa', descripcion: 'Bebida sin precio', precio: null, tipoProducto: 'PREPARADO', tiempoPreparacionMinutos: 5, estado: 'ACTIVO', idCategoria: 2, nombreCategoria: 'Bebidas', esSku: false, tieneSkus: true },
  { idProducto: 5, nombre: 'Gaseosa', precio: null, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 2, nombreCategoria: 'Bebidas', esSku: true, idProductoPadre: 4, nombreProductoPadre: 'Bebida Misteriosa', sku: 'BEB-GAS', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 6, nombre: 'Ensalada Clásica', descripcion: 'Ensalada', precio: null, tipoProducto: 'PREPARADO', tiempoPreparacionMinutos: 10, estado: 'ACTIVO', idCategoria: 3, nombreCategoria: 'Ensaladas', esSku: false, tieneSkus: true },
  { idProducto: 7, nombre: 'Simple', precio: 15, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 3, nombreCategoria: 'Ensaladas', esSku: true, idProductoPadre: 6, nombreProductoPadre: 'Ensalada Clásica', sku: 'ENS-SIM', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 8, nombre: 'Café Americano', descripcion: 'Producto simple valido', precio: 8, tipoProducto: 'INVENTARIO_DIRECTO', estado: 'ACTIVO', idCategoria: 4, nombreCategoria: 'Cafetería', esSku: false, tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 9, nombre: 'Producto Simple Sin Precio', descripcion: 'Producto simple sin precio', precio: null, tipoProducto: 'INVENTARIO_DIRECTO', estado: 'ACTIVO', idCategoria: 4, nombreCategoria: 'Cafetería', esSku: false, tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 10, nombre: 'Combo Forzado', descripcion: 'Producto con selector largo', precio: null, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 5, nombreCategoria: 'Combos', esSku: false, tieneSkus: true },
  { idProducto: 11, nombre: 'Opción A', precio: 11, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 5, nombreCategoria: 'Combos', esSku: true, idProductoPadre: 10, nombreProductoPadre: 'Combo Forzado', sku: 'CF-A', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 12, nombre: 'Opción B', precio: 12, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 5, nombreCategoria: 'Combos', esSku: true, idProductoPadre: 10, nombreProductoPadre: 'Combo Forzado', sku: 'CF-B', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 13, nombre: 'Opción C', precio: 13, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 5, nombreCategoria: 'Combos', esSku: true, idProductoPadre: 10, nombreProductoPadre: 'Combo Forzado', sku: 'CF-C', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 14, nombre: 'Opción D', precio: 14, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 5, nombreCategoria: 'Combos', esSku: true, idProductoPadre: 10, nombreProductoPadre: 'Combo Forzado', sku: 'CF-D', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 15, nombre: 'Opción Nula', precio: null, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 5, nombreCategoria: 'Combos', esSku: true, idProductoPadre: 10, nombreProductoPadre: 'Combo Forzado', sku: 'CF-N', tieneSkus: false, stockActual: 10, stockTotal: 10 },
  { idProducto: 16, nombre: 'Sopa del Día', descripcion: 'Preparado simple valido', precio: 9, tipoProducto: 'PREPARADO', estado: 'ACTIVO', idCategoria: 6, nombreCategoria: 'Sopas', esSku: false, tieneSkus: false },
  { idProducto: 17, nombre: 'Café Sin Stock', descripcion: 'Directo simple sin stock', precio: 7, tipoProducto: 'INVENTARIO_DIRECTO', estado: 'ACTIVO', idCategoria: 4, nombreCategoria: 'Cafetería', esSku: false, tieneSkus: false, stockActual: 0, stockTotal: 0 },
];

const MOCK_EXTRAS = [
  { idExtra: 1, nombre: 'Extra Queso', precio: 5, idInsumo: 1, nombreInsumo: 'Queso', cantidadConsumida: 0.1, estado: 'ACTIVO' },
  { idExtra: 2, nombre: 'Extra Sin Precio', precio: null, idInsumo: 2, nombreInsumo: 'Insumo X', cantidadConsumida: 0.1, estado: 'ACTIVO' },
];

const MOCK_CAJA = {
  idCaja: 1, fechaApertura: '2026-07-05T10:00:00', fechaCierre: null,
  montoApertura: 200, saldoActual: 200, estado: 'ABIERTA', observacion: null,
};

const MOCK_MESAS = [
  { idMesa: 1, numero: '1', nombre: 'Mesa 1', capacidad: 4, estado: 'DISPONIBLE' },
];

test.describe('POS pricing — null prices are blocked and Precio no configurado is shown', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'pos-pricing-test-token');
    });

    await context.route('**/api/v1/**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;

      if (path.endsWith('/auth/me')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      }

      if (path === '/api/v1/productos') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PRODUCTOS) });
      }

      const detailMatch = path.match(/^\/api\/v1\/productos\/(\d+)$/);
      if (detailMatch) {
        const id = parseInt(detailMatch[1], 10);
        const producto = MOCK_PRODUCTOS.find(p => p.idProducto === id);
        if (producto) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ producto }) });
        }
        return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
      }

      if (path.endsWith('/extras')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXTRAS) });
      }

      if (path.endsWith('/cajas/activa')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CAJA) });
      }

      if (path.endsWith('/mesas/disponibles')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MESAS) });
      }

      // Pedido activo por mesa → return null (no active order)
      const mesaActivoMatch = path.match(/\/pedidos\/mesa\/(\d+)\/activo$/);
      if (mesaActivoMatch) {
        return route.fulfill({ status: 204 });
      }

      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/pos');
    await page.waitForSelector('text=Pizza Clásica', { timeout: 15_000 });
  });

  const selectMesa = (page: import('playwright/test').Page) =>
    page.locator('select').first().selectOption('1');

  test('card with all null-price variants shows Precio no configurado and is disabled', async ({ page }) => {
    const card = page.locator('[class*="grid"] > div', { hasText: 'Bebida Misteriosa' }).first();
    await expect(card.locator('text=Precio no configurado').first()).toBeVisible();
    await expect(card).toHaveClass(/cursor-not-allowed/);
  });

  test('dialog opens for product with mixed prices and shows disabled null-price variant', async ({ page }) => {
    await selectMesa(page);
    await page.getByText('Pizza Clásica').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const personalTab = page.getByRole('tab', { name: /Personal/ });
    await expect(personalTab).toBeDisabled();
    await expect(personalTab).toContainText('Precio no configurado');

    const familiarTab = page.getByRole('tab', { name: /Familiar/ });
    await expect(familiarTab).toBeEnabled();
    await expect(familiarTab).toContainText(/S\/\s*45/);
  });

  test('extra with null price is disabled in product dialog', async ({ page }) => {
    await selectMesa(page);
    await page.getByText('Pizza Clásica').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const nullExtra = page.locator('label', { hasText: 'Extra Sin Precio' });
    await expect(nullExtra.locator('input[type="checkbox"]')).toBeDisabled();
    await expect(nullExtra).toContainText('Precio no configurado');

    const validExtra = page.locator('label', { hasText: 'Extra Queso' });
    await expect(validExtra.locator('input[type="checkbox"]')).toBeEnabled();
    await expect(validExtra).toContainText(/S\/\s*5/);
  });

  test('adds valid product to cart', async ({ page }) => {
    await selectMesa(page);
    await page.getByText('Ensalada Clásica').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /Agregar al pedido/i }).click();
    await expect(page.getByText('1 producto')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.tabular-nums')).toHaveText(/15/);
  });

  test('adds Pizza Familiar to cart and shows correct total', async ({ page }) => {
    await selectMesa(page);
    await page.getByText('Pizza Clásica').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /Agregar al pedido/i }).click();
    await expect(page.getByText('1 producto')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.tabular-nums')).toHaveText(/45/);
  });

  test('forced null-price variant confirmation leaves cart unchanged', async ({ page }) => {
    await selectMesa(page);
    await page.getByText('Combo Forzado').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('0 productos')).toBeVisible();

    await page.getByRole('combobox').last().evaluate((select) => {
      const variantSelect = select as HTMLSelectElement;
      variantSelect.value = 'Opción Nula';
      variantSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.getByText('El SKU Opción Nula no tiene precio configurado')).toBeVisible();

    await page.getByRole('button', { name: /Agregar al pedido/i }).evaluate((button) => {
      button.removeAttribute('disabled');
    });
    await page.getByRole('button', { name: /Agregar al pedido/i }).click({ force: true });

    await expect(page.getByText('0 productos')).toBeVisible();
    await expect(page.locator('.tabular-nums')).toHaveText(/0\.00/);
    await expect(page.getByText('El SKU Opción Nula no tiene precio configurado')).toBeVisible();
  });

  test('direct product with valid price enters cart without dialog', async ({ page }) => {
    await selectMesa(page);
    await page.getByText('Café Americano').first().click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('1 producto')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.tabular-nums')).toHaveText(/8/);
  });

  test('direct product with zero stock shows Sin stock and does not enter cart', async ({ page }) => {
    await selectMesa(page);
    const card = page.locator('[class*="grid"] > div', { hasText: 'Café Sin Stock' }).first();
    await expect(card.locator('text=Sin stock').first()).toBeVisible();
    await expect(card).toHaveClass(/cursor-not-allowed/);

    await card.click({ force: true });

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('0 productos')).toBeVisible();
    await expect(page.locator('.tabular-nums')).toHaveText(/0\.00/);
  });

  test('simple prepared product with valid price keeps modal flow and enters cart', async ({ page }) => {
    await selectMesa(page);
    await page.getByText('Sopa del Día').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /Agregar al pedido/i }).click();
    await expect(page.getByText('1 producto')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.tabular-nums')).toHaveText(/9/);
  });

  test('direct product with null price does not enter cart', async ({ page }) => {
    await selectMesa(page);
    const card = page.locator('[class*="grid"] > div', { hasText: 'Producto Simple Sin Precio' }).first();
    await expect(card.locator('text=Precio no configurado').first()).toBeVisible();
    await expect(card).toHaveClass(/cursor-not-allowed/);

    await card.click({ force: true });

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('0 productos')).toBeVisible();
    await expect(page.locator('.tabular-nums')).toHaveText(/0\.00/);
  });
});
