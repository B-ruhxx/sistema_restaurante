import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => {
  try {
    return readFileSync(resolve(root, path), 'utf8');
  } catch {
    return '';
  }
};
const checks = [];

function check(name, condition) {
  checks.push({ name, condition });
}

const routes = read('src/app/routes.tsx');
const lazyPages = read('src/app/lazyPages.tsx');
const layout = read('src/app/components/Layout.tsx');
const erpContext = read('src/app/contexts/ERPContext.tsx');
const permissions = read('src/config/permissions.ts');
const reports = read('src/app/pages/Reports.tsx');
const reportesApi = read('src/api/reportes.ts');
const reportesHook = read('src/hooks/useReportes.ts');
const securityApi = read('src/api/seguridad.ts');
const combosApi = read('src/api/combos.ts');
const cashRegister = read('src/app/pages/CashRegister.tsx');
const pos = read('src/app/pages/POS.tsx');
const products = read('src/app/pages/Products.tsx');
const customers = read('src/app/pages/Customers.tsx');
const suppliers = read('src/app/pages/Suppliers.tsx');
const categories = read('src/app/pages/Categories.tsx');
const recipeBuilder = read('src/app/pages/RecipeBuilder.tsx');
const productExtras = read('src/app/pages/ProductExtras.tsx');
const kitchen = read('src/app/pages/Kitchen.tsx');
const orders = read('src/app/pages/Orders.tsx');
const productosApi = read('src/api/productos.ts');
const extrasApi = read('src/api/extras.ts');
const variantesApi = read('src/api/variantes.ts');
const directInventory = read('src/app/pages/DirectInventory.tsx');
const purchases = read('src/app/pages/Purchases.tsx');
const comprasApi = read('src/api/compras.ts');
const movimientosApi = read('src/api/movimientos.ts');
const supplies = read('src/app/pages/Supplies.tsx');
const kardex = read('src/app/pages/Kardex.tsx');
const ventaService = read('../backend/src/main/java/com/restaurante/service/VentaService.java');
const pedidoService = read('../backend/src/main/java/com/restaurante/service/PedidoService.java');
const productoPolicy = read('../backend/src/main/java/com/restaurante/service/policy/ProductoPolicy.java');
const compraService = read('../backend/src/main/java/com/restaurante/service/CompraService.java');
const movimientoInventarioService = read('../backend/src/main/java/com/restaurante/service/MovimientoInventarioService.java');
const comboService = read('../backend/src/main/java/com/restaurante/service/ComboService.java');
const varianteService = read('../backend/src/main/java/com/restaurante/service/VarianteProductoService.java');
const extraService = read('../backend/src/main/java/com/restaurante/service/ExtraProductoService.java');
const skuMigrationService = read('../backend/src/main/java/com/restaurante/service/SkuMigrationPreparationService.java');
const reportesController = read('../backend/src/main/java/com/restaurante/controller/ReportesController.java');
const productoController = read('../backend/src/main/java/com/restaurante/controller/ProductoController.java');
const categoriaController = read('../backend/src/main/java/com/restaurante/controller/CategoriaController.java');
const categoriaService = read('../backend/src/main/java/com/restaurante/service/CategoriaService.java');
const loteInsumoService = read('../backend/src/main/java/com/restaurante/service/LoteInsumoService.java');
const loteProductoService = read('../backend/src/main/java/com/restaurante/service/LoteProductoService.java');
const inventarioProductoRepository = read('../backend/src/main/java/com/restaurante/repository/InventarioProductoRepository.java');
const loteInsumoEntity = read('../backend/src/main/java/com/restaurante/entity/LoteInsumo.java');
const loteProductoEntity = read('../backend/src/main/java/com/restaurante/entity/LoteProducto.java');
const recetaEntity = read('../backend/src/main/java/com/restaurante/entity/RecetaProducto.java');
const extraEntity = read('../backend/src/main/java/com/restaurante/entity/ExtraProducto.java');
const productoEntity = read('../backend/src/main/java/com/restaurante/entity/Producto.java');
const productoRequest = read('../backend/src/main/java/com/restaurante/dto/request/ProductoRequest.java');
const productoResponse = read('../backend/src/main/java/com/restaurante/dto/response/ProductoResponse.java');
const utilidadDiariaResponse = read('../backend/src/main/java/com/restaurante/dto/response/UtilidadDiariaResponse.java');
const loteProductoResponse = read('../backend/src/main/java/com/restaurante/dto/response/LoteProductoResponse.java');
const dataSeeder = read('../backend/src/main/java/com/restaurante/config/DataSeeder.java');
const applicationProperties = read('../backend/src/main/resources/application.properties');
const skuReadinessSql = read('../backend/src/main/resources/db/manual/2026-06-29_sku_migration_readiness.sql');
const cleanupTestDataSql = read('../backend/src/main/resources/db/manual/2026-06-29_cleanup_test_data_preserve_login.sql');
const fase12FinalCleanupSql = read('../backend/src/main/resources/db/manual/2026-06-29_fase12_final_saneamiento_legacy.sql');
const skuHierarchyMigration = read('../backend/src/main/resources/db/migration/V8__producto_sku_jerarquia.sql');
const productLotMigration = read('../backend/src/main/resources/db/migration/V9__lotes_producto_fifo.sql');
const variantSkuMigration = read('../backend/src/main/resources/db/migration/V10__variante_sku_compatibilidad.sql');
const variantMigratedMigration = read('../backend/src/main/resources/db/migration/V11__variante_migrada_estado.sql');
const variantPriceRemovalMigration = read('../backend/src/main/resources/db/migration/V12__eliminar_precio_extra_variante.sql');
const variantRequiredSkuMigration = read('../backend/src/main/resources/db/migration/V13__variante_sku_obligatorio.sql');
const varianteEntity = read('../backend/src/main/java/com/restaurante/entity/VarianteProducto.java');
const varianteRequest = read('../backend/src/main/java/com/restaurante/dto/request/VarianteProductoRequest.java');
const varianteResponse = read('../backend/src/main/java/com/restaurante/dto/response/VarianteProductoResponse.java');
const varianteController = read('../backend/src/main/java/com/restaurante/controller/VarianteProductoController.java');
const skuReadinessMd = read('SKU_MIGRATION_READINESS.md');

check('routes use React.lazy for code splitting', lazyPages.includes('export const Reports = lazy(') && routes.includes('<Suspense fallback='));
check('ventas route is exposed', routes.includes("path: '/ventas'"));
check('profile route is exposed', routes.includes("path: '/perfil'"));
check('layout uses backend permission vocabulary', layout.includes('PERMISSIONS.GESTION_CAJA') && permissions.includes('GESTION_VENTAS'));
check('security exposes backend actions', securityApi.includes('resolverAlerta') && securityApi.includes('cerrarSesion'));
check('reports generate a real PDF file', reports.includes("import('jspdf')") && reports.includes('.save(`Reporte_') && !reports.includes('window.print()'));
check('combo vigencia fields are part of the frontend contract', combosApi.includes('etiqueta?: string') && combosApi.includes('validoHasta?: string'));
check('cash register validates invoice RUC before cobrar', cashRegister.includes("cobroComprobante === 'FACTURA'") && cashRegister.includes('clienteTipoDocumento'));
check('orders actions column has a fallback', orders.includes('Sin acciones'));
check('kitchen cancel action is explicit per item', kitchen.includes('Cancelar item') && kitchen.includes('solo cancela el item seleccionado'));
check('kitchen shows countdown from preparation time', kitchen.includes('countdownTo') && kitchen.includes('Restan') && kitchen.includes('Vencido hace'));
check('POS hides stock units for prepared products', pos.includes("product.type === 'INVENTARIO_DIRECTO'") && pos.includes('usesPhysicalStock'));
check('POS variant price is not shown as an extra', pos.includes('v.price.toFixed(2)') && pos.includes('+S/ {extra.price.toFixed(2)}'));
check('products navigate directly to selected recipe', products.includes('navigate(`/recetas?producto=${selected.id}`)') && recipeBuilder.includes('useSearchParams'));
check('recipe builder uses one preparation time per recipe', recipeBuilder.includes('recipeTime') && !recipeBuilder.includes('timeMinutes'));
check('products expose active/inactive filters and reactivation', products.includes('setEstadoFilter') && products.includes('Reactivar') && productosApi.includes('updateEstado'));
check('customers expose active/inactive filters and reactivation', customers.includes('setEstadoFilter') && customers.includes('Reactivar') && customers.includes("estado: 'ACTIVO'"));
check('suppliers expose active/inactive filters and reactivation', suppliers.includes('setEstadoFilter') && suppliers.includes('Reactivar') && suppliers.includes("estado: 'ACTIVO'"));
check('categories support backend soft delete filtering and reactivation', categories.includes('setEstadoFilter') && categories.includes('Reactivar') && categoriaController.includes('/{id}/estado') && categoriaService.includes('getAllCategorias(String estado)'));
check('purchases require expiration date per detail', comprasApi.includes('fechaVencimiento') && purchases.includes('expirationDate') && purchases.includes('Vencimiento'));
check('inventory adjustments use formal endpoint', movimientosApi.includes('/inventario/ajustes') && directInventory.includes('movimientosApi.ajustar'));
check('direct inventory does not update product stock directly', !directInventory.includes('updateProducto') && !directInventory.includes('stockInicial'));
check('product stock is read-only in product form', products.includes('El stock actual es de solo lectura') && !products.includes('stockInicial: form.stock'));
check('supplies stock is read-only in master data form', supplies.includes('El stock se actualiza por compras y ajustes formales') && supplies.includes('movimientosApi.ajustar'));
check('insumo lots exist for FIFO', loteInsumoEntity.includes('cantidadDisponible') && loteInsumoEntity.includes('fechaVencimiento'));
check('sales consume insumo lots FIFO', ventaService.includes('descontarFifo') && ventaService.includes('setLoteInsumo'));
check('annulled sales return stock to consumed lot', ventaService.includes('devolverALote') && ventaService.includes('revertirConsumosInsumosVenta'));
check('kardex exposes lot expiration data', movimientosApi.includes('fechaVencimientoLote') && kardex.includes('Vence:'));
check('kardex uses backend stock snapshots and unit cost', movimientosApi.includes('stockAnterior') && movimientosApi.includes('stockNuevo') && movimientosApi.includes('costoUnitario') && kardex.includes('stockAnterior') && kardex.includes('stockNuevo') && kardex.includes('costoUnitario') && kardex.includes('referenceType'));
check('variant legacy backend services are retired and recipe builder uses child SKUs reales', !varianteService && !varianteController && !variantesApi && recipeBuilder.includes('SKU hijo') && recipeBuilder.includes('getProductoDetail(Number(target))'));
check('recipe builder edits base or child SKU BOM', recipeBuilder.includes('recipeTarget') && recipeBuilder.includes('Producto base') && recipeBuilder.includes('SKU hijo:'));
check('extras require physical insumo consumption', extraEntity.includes('cantidadConsumida') && extraService.includes('validarInsumoConsumible') && extrasApi.includes('cantidadConsumida'));
check('extras UI exposes insumo and consumed quantity', productExtras.includes('Insumo consumido') && productExtras.includes('Cantidad consumida'));
check('POS only exposes sellable extras', erpContext.includes("e.estado !== 'INACTIVO'") && erpContext.includes('e.cantidadConsumida > 0'));
check('orders reject ghost extras', pedidoService.includes('validarExtraVendible') && pedidoService.includes('getCantidadConsumida'));
check('sales consume variant BOM and extras through FIFO', ventaService.includes('obtenerRecetaVenta') && ventaService.includes('descontarExtras') && ventaService.includes('Consumo extra'));
check('SKU migration readiness legacy endpoint is not part of the active frontend surface', !reportesApi.includes('getSkuMigrationPreparation') && !reports.includes('Equivalencias Propuestas'));
check('backend product contract exposes SKU hierarchy', productoEntity.includes('productoPadre') && productoEntity.includes('esSku') && productoRequest.includes('idProductoPadre') && productoResponse.includes('tieneSkus'));
check('frontend prevents bare parent sales and exposes catalog unit', erpContext.includes('product.isCatalogParent && !variantMeta?.skuProductId') && products.includes('Unidad de catálogo') && products.includes('Producto padre sin stock propio'));
check('product lots service handles FIFO and returns', loteProductoEntity.includes('fechaVencimiento') && loteProductoService.includes('descontarFifo') && loteProductoService.includes('devolverALote'));
check('purchases can enter insumos or direct product SKUs', comprasApi.includes('idProducto?: number') && purchases.includes('SKU producto') && compraService.includes('registrarDetalleProducto') && compraService.includes('validarProductoComprable'));
check('sales and adjustments consume direct product lots FIFO', ventaService.includes('loteProductoService.descontarFifo') && ventaService.includes('setLoteProducto') && movimientoInventarioService.includes('LoteProductoService') && movimientoInventarioService.includes('descontarFifo(producto'));
check('frontend shows SKU lot summary in products and inventory', productosApi.includes('proximoVencimiento?: string') && products.includes('Stock total SKUs') && directInventory.includes('lotes disponibles') && erpContext.includes('stockTotal'));
check('direct SKU lot detail is exposed with purchase origin', productosApi.includes('getLotes') && productoController.includes('/{id}/lotes') && loteProductoResponse.includes('proveedorNombre') && directInventory.includes('LotsDialog') && directInventory.includes('codigoCompra'));
check('variant legacy contract is retired from backend and frontend api surface', !varianteEntity && !varianteRequest && !varianteResponse && !varianteController && !variantesApi);
check('frontend manages variants as real child SKU grid', products.includes('SKUs hijos reales vinculados') && products.includes('Nuevo SKU hijo') && !products.includes('linkedSkuOptions'));
check('POS can sell catalog parent through child SKU option', erpContext.includes('skuChildrenByParent') && erpContext.includes('skuProductId: sku.idProducto') && erpContext.includes('variantSkuProductId') && productoPolicy.includes('Selecciona un SKU.'));
check('frontend edits sku recipe through product detail flow', recipeBuilder.includes('getProductoDetail(Number(target))') && recipeBuilder.includes('p.idProductoPadre === activeId'));
check('variant conversion wizard and endpoint are retired', !varianteController && !varianteService && !variantesApi && !products.includes('Convertir a SKU'));
check('product parent price is blocked and SKUs carry real price', products.includes('No aplica a producto padre') && products.includes('Precio real') && products.includes('Stock computado'));
check('combos backend reject parent products and require operational skus', comboService.includes('Los combos solo pueden incluir SKUs vendibles') && comboService.includes('validarProductoCombo'));
check('executive dashboard uses native daily profit endpoint', reportesApi.includes('getUtilidadDiaria') && reportesHook.includes('utilidadDiariaQuery') && reportesController.includes('/utilidad-diaria') && utilidadDiariaResponse.includes('private BigDecimal utilidad'));

const failed = checks.filter((item) => !item.condition);
for (const item of checks) {
  console.log(`${item.condition ? 'ok' : 'fail'} - ${item.name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
