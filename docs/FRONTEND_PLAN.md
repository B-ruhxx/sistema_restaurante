# Plan de alineación de contratos del frontend

## Fuente de verdad

El backend Spring Boot está terminado y es la única fuente de verdad para:

* endpoints;
* métodos HTTP;
* DTO de request;
* DTO de response;
* enums;
* campos requeridos;
* permisos;
* códigos de estado;
* reglas de negocio.

No modificar el backend para adaptar contratos obsoletos del frontend.

## Estrategia OpenAPI

El frontend dispone de generación automática de contratos mediante:

```bash
npm run contracts:generate
npm run contracts:check
```

El generador utiliza esta prioridad:

1. Backend activo en `/v3/api-docs`.
2. Archivo de respaldo `backend/openapi-baseline.json`.
3. Variable `OPENAPI_USE_BASELINE=true` para forzar el baseline.

El archivo:

```text
frontend/src/api/generated/openapi-types.ts
```

es generado automáticamente y no debe editarse manualmente.

Cuando el backend esté activo, el baseline se actualiza desde `frontend/` con:

```bash
curl -fsS http://localhost:8080/v3/api-docs \
  -o ../backend/openapi-baseline.json
```

Después de actualizarlo ejecutar:

```bash
npm run contracts:generate
npm run contracts:check
```

Los cambios de:

```text
backend/openapi-baseline.json
frontend/src/api/generated/openapi-types.ts
```

deben incluirse en el commit correspondiente cuando representen cambios reales del contrato.

## Reglas generales

Antes de implementar cada fase:

1. Entrar al directorio `frontend`.
2. Ejecutar `npm run contracts:generate`.
3. Ejecutar `npm run contracts:check`.
4. Inspeccionar los controladores y DTO reales relacionados.
5. Revisar todos los archivos frontend afectados.
6. No suponer contratos.
7. No editar manualmente `openapi-types.ts`.
8. No usar `any`.
9. No usar casts para ocultar incompatibilidades.
10. No modificar módulos fuera del alcance de la fase.
11. Mantener el diseño existente salvo que el contrato requiera un cambio visible.
12. Buscar referencias restantes a contratos antiguos.
13. Realizar un commit independiente por fase.

Al finalizar cada fase:

1. Ejecutar nuevamente `npm run contracts:generate`.
2. Ejecutar `npm run contracts:check`.
3. Ejecutar TypeScript.
4. Ejecutar lint.
5. Ejecutar build.
6. Revisar el diff de los tipos generados.
7. Confirmar que la fase no introdujo incompatibilidades.
8. No continuar mientras existan errores producidos por la fase actual.

---

# Fase 1: Caja y métodos de pago

## Estado

Completada.

## Objetivo

Alinear Caja y Métodos de Pago con los contratos reales del backend.

## Archivos inicialmente relacionados

* `frontend/src/api/generated/openapi-types.ts`
* `frontend/src/api/metodoPagos.ts`
* `frontend/src/api/cajas.ts`
* `frontend/src/hooks/useMetodoPagos.ts`
* `frontend/src/app/pages/CashRegister.tsx`
* `frontend/src/app/contexts/ERPContext.tsx`

## Cambios requeridos

* Reemplazar `requiereOperacion` por `requiereReferencia`.
* Eliminar el uso de `afectaCaja` si el backend no devuelve ese campo.
* Reemplazar `idMovimientoCaja` por `idMovimiento`.
* Unificar las query keys de métodos de pago.
* Agregar soporte para `TICKET`.
* Corregir validaciones de referencias en el cobro.
* Adaptar ERPContext al contrato real.
* Eliminar tipos duplicados u obsoletos.

## Validación OpenAPI

Antes y después de la fase:

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
```

## Verificación

Buscar referencias restantes a:

* `requiereOperacion`
* `afectaCaja`
* `idMovimientoCaja`
* `metodo-pagos`

Probar:

* apertura de caja;
* cobro en efectivo;
* cobro con tarjeta;
* método que exige referencia;
* refresco de métodos de pago sin recargar la página.

## Commit sugerido

```text
fix(frontend): align cash register and payment contracts
```

---

# Fase 2: permisos y navegación

## Objetivo

Alinear la navegación, visibilidad y rutas protegidas con los permisos reales del backend.

## Archivos inicialmente relacionados

* `frontend/src/config/permissions.ts`
* `frontend/src/app/components/Layout.tsx`
* `frontend/src/app/components/ProtectedRoute.tsx`

## Validación inicial OpenAPI

Antes de editar:

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
```

Aunque los permisos pueden no estar representados completamente en los esquemas OpenAPI, esta validación confirma que la fase parte de contratos frontend actualizados.

Después se deben inspeccionar directamente:

* permisos sembrados por el backend;
* anotaciones `@PreAuthorize`;
* reglas de Spring Security;
* permisos devueltos en autenticación;
* rutas protegidas del frontend.

## Cambios requeridos

* Registrar el catálogo real de permisos.
* Usar `GESTION_AUDITORIA` para Auditoría.
* Eliminar dependencias incorrectas de `GESTION_REPORTES`.
* No depender únicamente de `ACCESO_TOTAL`.
* Separar visibilidad del menú y autorización de rutas.
* Mantener acceso para usuarios con permisos granulares válidos.

## Verificación

Probar usuarios con:

* `GESTION_ROLES`
* `GESTION_PRODUCTOS`
* `GESTION_RECETAS`
* `GESTION_INVENTARIO`
* `GESTION_AUDITORIA`
* `GESTION_PEDIDOS`

## Validación final OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
npm run lint
npm run build
```

Si lint presenta errores preexistentes, documentarlos y confirmar que la fase no agregó errores nuevos.

## Commit sugerido

```text
fix(frontend): align permissions and protected navigation
```

---

# Fase 3: clientes y POS

## Objetivo

Representar correctamente todos los tipos de documento admitidos por el backend.

## Archivos inicialmente relacionados

* `frontend/src/api/clientes.ts`
* `frontend/src/app/pages/Customers.tsx`
* `frontend/src/app/pages/POS.tsx`
* `frontend/src/app/contexts/ERPContext.tsx`
* `frontend/src/app/contexts/ERPContextValue.ts`

## Validación inicial OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
```

Antes de definir tipos locales, revisar los esquemas generados correspondientes a:

* `ClienteRequest`;
* `ClienteResponse`;
* `TipoDocumento`;
* requests utilizados por POS.

No duplicar enums si ya existen en `ApiSchemas`.

## Enum real

```ts
export type TipoDocumento =
  | 'DNI'
  | 'RUC'
  | 'CE'
  | 'PASAPORTE'
  | 'SIN_DOCUMENTO';
```

El enum debe derivarse o verificarse contra el contrato generado.

## Cambios requeridos

* Agregar todos los valores reales.
* Eliminar la conversión automática de documentos no-RUC a DNI.
* Conservar el tipo real recibido del backend.
* Permitir crear y editar clientes con todos los valores.
* Definir correctamente el comportamiento de `SIN_DOCUMENTO`.
* Corregir mapeos de ERPContext y POS.
* Evitar duplicar contratos ya generados por OpenAPI.

## Verificación

Crear, editar, buscar y seleccionar clientes con:

* DNI;
* RUC;
* CE;
* PASAPORTE;
* SIN_DOCUMENTO.

Crear un pedido desde POS con cada tipo.

## Validación final OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
npm run lint
npm run build
```

Buscar además:

```bash
grep -R "PASAPORTE\|SIN_DOCUMENTO\|tipoDocumento" src
```

## Commit sugerido

```text
fix(frontend): synchronize customer document types
```

---

# Fase 4: Kardex e inventario directo

## Objetivo

Alinear movimientos de inventario y ajustes con los enums y respuestas reales.

## Archivos inicialmente relacionados

* `frontend/src/api/movimientos.ts`
* `frontend/src/app/pages/Kardex.tsx`
* `frontend/src/app/pages/DirectInventory.tsx`
* `frontend/src/app/pages/Supplies.tsx`

## Validación inicial OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
```

Revisar en los tipos generados:

* `MovimientoInventarioResponse`;
* `AjusteInventarioRequest`;
* `AjusteInventarioResponse`;
* enum de tipos de movimiento;
* campos de cantidades, costos y referencias.

## Enum real

```ts
export type TipoMovimiento =
  | 'ENTRADA_COMPRA'
  | 'SALIDA_VENTA'
  | 'SALIDA_AJUSTE'
  | 'ENTRADA_ANULACION'
  | 'MERMA'
  | 'DEVOLUCION'
  | 'CORRECCION';
```

El tipo debe derivarse o verificarse contra `ApiSchemas`.

## Cambios requeridos

* Eliminar lógica basada en coincidencias de texto.
* Crear clasificación explícita de entradas, salidas y correcciones.
* Corregir signos de cantidades y costos.
* Corregir KPIs, filtros, badges y exportes.
* Crear o reutilizar el tipo real `AjusteInventarioResponse`.
* Tipar correctamente su colección de movimientos.
* No duplicar manualmente tipos disponibles en OpenAPI.

## Verificación

Registrar y visualizar:

* compra;
* venta;
* ajuste;
* anulación;
* merma;
* devolución;
* corrección.

## Validación final OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
npm run lint
npm run build
```

Comprobar que la segunda generación no produzca cambios inesperados:

```bash
git diff -- src/api/generated/openapi-types.ts
```

## Commit sugerido

```text
fix(frontend): align inventory movement contracts
```

---

# Fase 5: caché de React Query

## Objetivo

Evitar datos desactualizados después de compras y cambios en métodos de pago.

## Archivos inicialmente relacionados

* `frontend/src/hooks/useCompras.ts`
* `frontend/src/hooks/useMetodoPagos.ts`
* consumidores de las query keys relacionadas

## Validación inicial OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
```

La caché no forma parte directa del contrato OpenAPI, pero debe construirse sobre endpoints, requests y responses actualizados.

## Cambios requeridos

Después de crear o anular una compra, invalidar:

* `compras`
* `insumos`
* `productos`
* `movimientos`
* `reportes`

Crear una fábrica centralizada de query keys para métodos de pago.

Eliminar query keys alternativas para la misma información.

Mantener referencias estables y evitar arrays nuevos en cada render cuando no existan datos.

## Verificación

* Comprar un insumo.
* Comprar un producto directo.
* Confirmar actualización inmediata de stock y movimientos.
* Crear o editar un método de pago.
* Confirmar actualización de Caja sin recargar.

## Validación final OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
npm run lint
npm run build
```

## Commit sugerido

```text
fix(frontend): synchronize purchase and payment caches
```

---

# Fase 6: contratos menores

## Objetivo

Eliminar incompatibilidades no bloqueantes y valores obsoletos.

## Archivos inicialmente relacionados

* `frontend/src/api/precuentas.ts`
* `frontend/src/api/ventas.ts`
* `frontend/src/api/cajas.ts`
* `frontend/src/api/configuracion.ts`
* `frontend/src/app/pages/ProductExtras.tsx`
* `frontend/src/app/pages/Employees.tsx`
* `frontend/src/app/pages/Sales.tsx`

## Validación inicial OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
```

Revisar en `ApiSchemas`:

* estados de precuenta;
* tipos de comprobante;
* `ConfiguracionRequest`;
* `ExtraProductoRequest`;
* URLs o campos de imágenes;
* requests y responses de ventas y caja.

## Cambios requeridos

* Agregar `ANULADA` a estados de precuenta.
* Agregar `TICKET` a tipos de comprobante.
* Marcar `ruc` e `igv` como requeridos.
* Eliminar `offsetConsumo` del payload de extras.
* Eliminar URLs de backend hardcodeadas.
* Usar `getFullImageUrl` para avatares.
* Reutilizar contratos generados siempre que sea posible.

## Verificación

* Renderizar precuenta anulada.
* Mostrar una venta con comprobante TICKET.
* Guardar configuración válida.
* Crear y editar un extra.
* Mostrar avatares usando la URL configurada.

## Validación final OpenAPI

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
npm run lint
npm run build
```

## Commit sugerido

```text
fix(frontend): clean remaining backend contract mismatches
```

---

# Protocolo OpenAPI obligatorio por fase

## Inicio de fase

Ejecutar desde `frontend/`:

```bash
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
```

Objetivos:

1. partir de contratos actualizados;
2. detectar modificaciones manuales en tipos generados;
3. confirmar que el estado inicial compila;
4. distinguir errores preexistentes de errores introducidos por la fase.

Si el backend está apagado, el generador utilizará automáticamente:

```text
backend/openapi-baseline.json
```

Para forzar el baseline:

```bash
OPENAPI_USE_BASELINE=true npm run contracts:generate
OPENAPI_USE_BASELINE=true npm run contracts:check
```

## Cierre de fase

Ejecutar:

```bash
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
npm run lint
npm run build
```

Después revisar:

```bash
git status --short
git diff --stat
git diff -- src/api/generated/openapi-types.ts
```

Si `openapi-types.ts` cambia inesperadamente:

1. no hacer commit todavía;
2. comparar con `backend/openapi-baseline.json`;
3. verificar si el backend vivo tiene cambios nuevos;
4. confirmar que el baseline esté actualizado;
5. regenerar nuevamente.

## Actualización del baseline

Cuando el backend esté corriendo:

```bash
cd frontend

curl -fsS http://localhost:8080/v3/api-docs \
  -o ../backend/openapi-baseline.json

npm run contracts:generate
npm run contracts:check
```

Validar que el archivo descargado sea JSON válido:

```bash
node -e "
const fs = require('fs');
JSON.parse(fs.readFileSync('../backend/openapi-baseline.json', 'utf8'));
console.log('OpenAPI baseline válido');
"
```

Nunca reemplazar el baseline con una respuesta vacía o un error HTML.

---

# Validación obligatoria por fase

Después de cada fase ejecutar:

```bash
cd frontend
npm run contracts:generate
npm run contracts:check
npx tsc --noEmit
npm run lint
npm run build
```

Si existe el script:

```bash
npm run typecheck
```

puede utilizarse en lugar de:

```bash
npx tsc --noEmit
```

No continuar a la siguiente fase mientras existan errores producidos por la fase actual.

Los errores preexistentes deben documentarse indicando:

* comando;
* cantidad de errores;
* archivos afectados;
* confirmación de que no fueron introducidos por la fase.

---

# Revisión obligatoria antes del commit

Después de implementar una fase:

1. Ejecutar el subagente `code-reviewer`.
2. Corregir únicamente observaciones válidas.
3. Repetir el protocolo OpenAPI de cierre.
4. Revisar `git status`.
5. Revisar `git diff`.
6. Agregar únicamente archivos de la fase.
7. Crear el commit sugerido.
8. No hacer push automáticamente.

Prompt corto de revisión:

```text
@code-reviewer revisa únicamente la fase recién implementada según
docs/FRONTEND_PLAN.md.

Compara los cambios con el backend real y los tipos OpenAPI generados.
No edites archivos.
Indica solo hallazgos bloqueantes o relevantes.
```

Prompt corto de corrección:

```text
@frontend-react corrige únicamente las observaciones válidas de la revisión.

No amplíes el alcance de la fase.
Ejecuta contracts:generate, contracts:check, tsc y build.
```

---

# Informe final de cada fase

Entregar únicamente:

1. archivos modificados;
2. contratos corregidos;
3. origen OpenAPI utilizado:

   * backend vivo;
   * baseline;
4. resultado de `contracts:generate`;
5. resultado de `contracts:check`;
6. resultado de TypeScript;
7. resultado de lint;
8. resultado del build;
9. riesgos pendientes;
10. prueba manual recomendada;
11. commit sugerido.
