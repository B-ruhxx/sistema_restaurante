import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const LOGIN_USER = process.env.LOGIN_USER || 'admin';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || 'admin123';
const VISUAL_AUTH_MODE = process.env.VISUAL_AUTH_MODE || 'mock';
const OUTPUT_DIR = process.env.SCREENSHOT_DIR || path.resolve('artifacts/playwright-visual');

const routes = [
  { path: '/', name: 'dashboard' },
  { path: '/mesas', name: 'mesas' },
  { path: '/pos', name: 'pos' },
  { path: '/pedidos', name: 'pedidos' },
  { path: '/cocina', name: 'cocina' },
  { path: '/caja', name: 'caja' },
  { path: '/categorias', name: 'categorias' },
  { path: '/productos', name: 'productos' },
  { path: '/combos', name: 'combos' },
  { path: '/extras', name: 'extras' },
  { path: '/recetas', name: 'recetas' },
  { path: '/insumos', name: 'insumos' },
  { path: '/kardex', name: 'kardex' },
  { path: '/inventario', name: 'inventario' },
  { path: '/proveedores', name: 'proveedores' },
  { path: '/compras', name: 'compras' },
  { path: '/dashboard-gerencial', name: 'dashboard-gerencial' },
  { path: '/reportes', name: 'reportes' },
  { path: '/clientes', name: 'clientes' },
  { path: '/ventas', name: 'ventas' },
  { path: '/empleados', name: 'empleados' },
  { path: '/roles', name: 'roles' },
  { path: '/metodos-pago', name: 'metodos-pago' },
  { path: '/perfil', name: 'perfil' },
  { path: '/auditoria', name: 'auditoria' },
  { path: '/seguridad', name: 'seguridad' },
  { path: '/configuracion', name: 'configuracion' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const modalTargets = {
  '/clientes': {
    openButtonText: 'Nuevo Cliente',
    dialogTitle: 'Nuevo Cliente',
    comboboxIndex: 0,
  },
  '/proveedores': {
    openButtonText: 'Nuevo Proveedor',
    dialogTitle: 'Nuevo Proveedor',
    comboboxIndex: 0,
  },
  '/categorias': {
    openButtonText: 'Nueva Categoría',
    dialogTitle: 'Nueva Categoría',
  },
  '/combos': {
    openButtonText: 'Nuevo Combo',
    dialogTitle: 'Nuevo Combo',
    comboboxIndex: 0,
  },
  '/productos': {
    openButtonText: 'Nuevo Producto',
    dialogTitle: 'Nuevo producto padre',
    comboboxIndex: 0,
  },
  '/compras': {
    openButtonText: 'Nueva Compra',
    dialogTitle: 'Nueva Orden de Compra',
    comboboxIndex: 0,
    secondaryComboboxIndex: 1,
  },
  '/empleados': {
    openButtonText: 'Nuevo Empleado',
    dialogTitle: 'Nuevo Empleado',
    comboboxIndex: 0,
  },
  '/roles': {
    openButtonText: 'Nuevo Rol',
    dialogTitle: 'Nuevo Rol',
  },
  '/metodos-pago': {
    openButtonText: 'Nuevo Método',
    dialogTitle: 'Nuevo Método de Pago',
    comboboxIndex: 0,
  },
  '/mesas': {
    openButtonText: 'Nueva mesa',
    dialogTitle: 'Nueva mesa',
  },
  '/configuracion': {
    openButtonText: null,
    dialogTitle: null,
    comboboxIndex: 0,
  },
};

async function ensureLoggedIn(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input#username', LOGIN_USER);
  await page.fill('input#password', LOGIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname !== '/login', {
    timeout: 30_000,
  });
}

function mockJsonForPath(pathname) {
  if (pathname === '/api/v1/auth/me') {
    return {
      idEmpleado: 1,
      nombre: 'Administrador',
      apellido: 'Visual',
      username: 'admin',
      rol: 'ADMINISTRADOR',
      avatarUrl: null,
      permisos: ['ACCESO_TOTAL'],
    };
  }

  if (pathname.startsWith('/api/v1/reportes/')) {
    if (pathname.includes('/resumen-financiero')) {
      return {
        totalVentas: 0,
        baseImponible: 0,
        igv: 0,
        costoTotal: 0,
        totalCompras: 0,
        gananciaNeta: 0,
      };
    }
    return [];
  }

  if (pathname.startsWith('/api/v1/cajas')) {
    if (pathname.endsWith('/activa')) return null;
    return [];
  }

  if (pathname.startsWith('/api/v1/insumos')) return [];
  if (pathname.startsWith('/api/v1/productos')) return [];
  if (pathname.startsWith('/api/v1/pedidos')) return [];
  if (pathname.startsWith('/api/v1/cocina')) return [];
  if (pathname.startsWith('/api/v1/seguridad')) return [];
  if (pathname.startsWith('/api/v1/clientes')) return [];
  if (pathname.startsWith('/api/v1/empleados')) return [];
  if (pathname.startsWith('/api/v1/ventas')) return [];
  if (pathname.startsWith('/api/v1/compras')) return [];
  if (pathname.startsWith('/api/v1/configuracion')) {
    return {
      nombreEmpresa: 'RestaurantERP',
      razonSocial: 'RestaurantERP SAC',
      ruc: '20123456789',
      logoUrl: '',
      direccion: 'Av. Prueba 123',
      telefono: '000000000',
      email: 'demo@restaurante.local',
      serieBoleta: 'B001',
      serieFactura: 'F001',
      igv: 18,
      moneda: 'PEN',
    };
  }

  return [];
}

async function enableMockMode(context) {
  await context.addInitScript(() => {
    localStorage.setItem('token', 'visual-validation-token');
  });

  await context.route('**/api/v1/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const payload = mockJsonForPath(pathname);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

async function validateRoute(page, route, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(750);

  const report = await page.evaluate(() => {
    const bodyText = document.body?.innerText?.trim() || '';
    const interactiveCount = document.querySelectorAll('button, input, select, table, [role="tab"], [role="dialog"]').length;
    const visibleCards = Array.from(document.querySelectorAll('[data-slot="card"], .card, article, section')).filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length;
    return {
      bodyTextLength: bodyText.length,
      interactiveCount,
      visibleCards,
      title: document.title,
    };
  });

  const screenshotPath = path.join(OUTPUT_DIR, `${route.name}-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const modalTarget = modalTargets[route.path];
  const extraShots = [];
  if (modalTarget) {
    try {
      if (modalTarget.openButtonText) {
        await page.getByRole('button', { name: modalTarget.openButtonText }).click({ timeout: 3000 });
        await page.getByRole('dialog').first().waitFor({ state: 'visible', timeout: 5000 });

        const dialogShot = path.join(OUTPUT_DIR, `${route.name}-${viewport.name}-dialog.png`);
        await page.screenshot({ path: dialogShot, fullPage: true });
        extraShots.push(dialogShot);

        if (typeof modalTarget.comboboxIndex === 'number') {
          const comboboxes = page.locator('[role="dialog"] [role="combobox"]');
          const count = await comboboxes.count();
          if (count > modalTarget.comboboxIndex) {
            await comboboxes.nth(modalTarget.comboboxIndex).click({ timeout: 3000 });
            await page.waitForTimeout(350);
            const dropdownShot = path.join(OUTPUT_DIR, `${route.name}-${viewport.name}-dropdown.png`);
            await page.screenshot({ path: dropdownShot, fullPage: true });
            extraShots.push(dropdownShot);
            await page.keyboard.press('Escape').catch(() => {});
          }
        }

        if (typeof modalTarget.secondaryComboboxIndex === 'number') {
          const comboboxes = page.locator('[role="dialog"] [role="combobox"]');
          const count = await comboboxes.count();
          if (count > modalTarget.secondaryComboboxIndex) {
            await comboboxes.nth(modalTarget.secondaryComboboxIndex).click({ timeout: 3000 });
            await page.waitForTimeout(350);
            const dropdownShot = path.join(OUTPUT_DIR, `${route.name}-${viewport.name}-dropdown-2.png`);
            await page.screenshot({ path: dropdownShot, fullPage: true });
            extraShots.push(dropdownShot);
            await page.keyboard.press('Escape').catch(() => {});
          }
        }
      } else if (typeof modalTarget.comboboxIndex === 'number') {
        const comboboxes = page.locator('[role="combobox"]');
        const count = await comboboxes.count();
        if (count > modalTarget.comboboxIndex) {
          await comboboxes.nth(modalTarget.comboboxIndex).click({ timeout: 3000 });
          await page.waitForTimeout(350);
          const dropdownShot = path.join(OUTPUT_DIR, `${route.name}-${viewport.name}-dropdown.png`);
          await page.screenshot({ path: dropdownShot, fullPage: true });
          extraShots.push(dropdownShot);
          await page.keyboard.press('Escape').catch(() => {});
        }
      }
    } catch (error) {
      extraShots.push(`interaction failed: ${error.message}`);
    }
  }

  const issues = [];
  if (report.bodyTextLength < 20) {
    issues.push('body text too short');
  }
  if (report.interactiveCount === 0) {
    issues.push('no interactive elements detected');
  }

  return {
    route: route.path,
    viewport: viewport.name,
    screenshotPath,
    extraShots,
    ...report,
    issues,
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    baseURL: BASE_URL,
  });

  const page = await context.newPage();
  if (VISUAL_AUTH_MODE === 'mock') {
    await enableMockMode(context);
  } else {
    await ensureLoggedIn(page);
  }

  const results = [];
  for (const route of routes) {
    for (const viewport of viewports) {
      results.push(await validateRoute(page, route, viewport));
    }
  }

  await browser.close();

  const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
  await writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf8');

  const failing = results.filter((item) => item.issues.length > 0);
  if (failing.length > 0) {
    console.error('Visual validation found issues:');
    for (const item of failing) {
      console.error(`- ${item.route} [${item.viewport}]: ${item.issues.join(', ')}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Visual validation OK for ${results.length} route/view combinations.`);
    console.log(`Screenshots: ${OUTPUT_DIR}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
