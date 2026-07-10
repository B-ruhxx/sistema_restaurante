# Plan técnico ejecutable por fases y agentes


## 0. Estrategia de ejecución

Este documento no debe ejecutarse como una lista gigante de cambios. Cada fase se trabaja como una unidad cerrada, con diagnóstico, implementación, pruebas, revisión y commit independiente.

### Agentes y responsabilidades

| Agente | Responsabilidad principal | No debe hacer |
|---|---|---|
| `@explore` | Explorar el repositorio, localizar archivos, mapear flujos, dependencias y pruebas existentes | Editar código o crear commits |
| `@backend-spring` | Backend, base de datos, migraciones Flyway, transacciones, concurrencia y pruebas Java/MariaDB | Cambiar frontend salvo que el contrato lo exija y esté aprobado |
| `@frontend-react` | React, UI, React Query, contratos tipados, Vitest y Playwright | Implementar reglas de negocio que pertenecen al backend |
| `@code-reviewer` | Auditar diagnósticos y diffs, detectar riesgos, validar pruebas y autorizar el cierre | Implementar cambios funcionales salvo instrucción explícita |
| `@general` | Coordinar el plan, ejecutar comandos, actualizar el tablero, integrar resultados y crear commits | Mezclar fases o aceptar trabajo sin evidencia |

### Equivalencias operativas

```text
@explore         = diagnóstico inicial
@backend-spring  = backend + base de datos + integración Java
@frontend-react  = frontend + pruebas UI/E2E
@code-reviewer   = revisión independiente
@general         = coordinación + validación final + commit
```

### Ciclo obligatorio por fase

```text
1. @explore realiza el diagnóstico
2. @general fija el alcance mínimo
3. @backend-spring o @frontend-react implementa
4. El agente implementador ejecuta sus pruebas
5. @code-reviewer revisa de forma independiente
6. El agente implementador corrige hallazgos
7. Se reejecutan las pruebas
8. @general crea el commit aislado
9. @general actualiza el tablero
```

Ninguna fase se considera cerrada porque “compila”. Debe demostrar sus criterios de aceptación.

### Regla de control de alcance

Cada solicitud a un agente debe incluir:

```text
- objetivo único;
- archivos o módulos permitidos;
- archivos o módulos prohibidos;
- pruebas obligatorias;
- criterio de terminado;
- no hacer commit hasta revisión final.
```

### Evidencia mínima de cierre

Cada fase debe entregar:

- causa raíz o diagnóstico;
- archivos creados y modificados;
- decisiones técnicas tomadas;
- pruebas ejecutadas con resultado;
- riesgos residuales;
- resultado de `@code-reviewer`;
- hash y mensaje del commit, cuando corresponda.

### Convención de commits

```text
fix(backend): ...
fix(frontend): ...
perf(backend): ...
test(e2e): ...
refactor(...): ...
feat(pos): ...
feat(inventory): ...
```

Un commit por problema o fase cerrada. No crear commits Frankenstein.

---

## 0.1 Estado real antes de comenzar

Antes de ejecutar este plan, `@general` debe confirmar en Git qué trabajo ya existe para no repetirlo.

Trabajo reciente que debe verificarse y reutilizarse:

- suite Playwright de auditoría E2E;
- corrección de `GET /api/v1/productos/{id}` por `LazyInitializationException`;
- eliminación del N+1 en listados de productos;
- manejo frontend de precios nulos en POS;
- generación backend de correlativos de venta;
- pruebas de integración MariaDB;
- contratos OpenAPI regenerados.

Comando inicial:

```bash
git status --short
git log --oneline -15
git diff --stat
```

El agente debe clasificar cada punto como:

```text
COMPLETADO
EN REVISIÓN
PENDIENTE
BLOQUEADO
NO APLICA
```

No se debe volver a implementar algo ya cerrado y probado.

---

## 0.2 Orden de ejecución recomendado

El orden original se mantiene, pero con una puerta de estabilización inmediata:

```text
Bloque A: cerrar fallos abiertos actuales
  A1. Correlativos y cobro
  A2. Precio null en POS
  A3. Reejecutar Playwright

Bloque B: inventario
  Fase 0 → Fase 1 → Fase 2 → Fase 3

Bloque C: operación por mesas
  Fase 4 → Fase 5 → Fase 6 → Fase 7

Bloque D: rendimiento y UX
  Fase 8 → Fase 9

Bloque E: cierre
  Fase 10
```

No se inicia una fase nueva mientras exista un hallazgo alto o medio sin resolver en la anterior.

---

## 0.3 Puerta inmediata A: cerrar hallazgos ya abiertos

### A1. Correlativos y cobro

Debe cerrarse antes de continuar con inventario porque el cobro es parte de la transacción crítica.

Pendientes mínimos:

- `POST /api/v1/ventas` no acepta `serie` ni `numero` controlados por cliente;
- toda venta usa el correlativo backend;
- creación segura de series no sembradas;
- unicidad de comprobantes definida y protegida por BD;
- pruebas reales de consecutividad, rollback y concurrencia;
- cobro no deja venta, pago, movimiento o pedido parcial.

Agentes:

```text
@explore → diagnóstico
@backend-spring → implementación, migración y pruebas MariaDB
@code-reviewer → cierre
@general → commit
```

### A2. Precio nulo en POS

Pendientes mínimos:

- producto, variante o extra sin precio no entra al carrito;
- no existe fallback silencioso a cero;
- prueba de integración UI cubre `POS.tsx → addToCart`;
- producto válido continúa funcionando.

Agentes:

```text
@explore → diagnóstico del flujo real
@frontend-react → implementación y prueba UI
@code-reviewer → cierre
@general → commit
```

### A3. Auditoría Playwright

Al cerrar A1 y A2:

```bash
cd frontend
npm run test:e2e:audit
```

Resultado requerido:

- cero respuestas `5xx`;
- cero excepciones JS;
- cero `console.error` de la aplicación;
- los `4xx` esperados quedan explícitamente afirmados;
- resumen por endpoint actualizado.

---

## 0.4 Plantilla maestra para ejecutar una fase

```text
@general coordina la Fase N del plan.md usando únicamente:
- @explore
- @backend-spring
- @frontend-react
- @code-reviewer
- @general

Secuencia obligatoria:
1. Pide a @explore un diagnóstico sin editar.
2. Define un alcance mínimo y archivos permitidos.
3. Delega la implementación a @backend-spring o @frontend-react.
4. Exige pruebas específicas de la fase.
5. Pide a @code-reviewer una revisión independiente.
6. No permitas commit con hallazgos altos o medios.
7. Registra deudas fuera de alcance sin mezclarlas.
8. Cuando quede limpio, crea un commit aislado.
9. Actualiza el tablero.

Entrega al final:
- resumen técnico;
- pruebas ejecutadas;
- riesgos residuales;
- archivos incluidos;
- hash y mensaje del commit.
```

## 0.5 Matriz de responsables por fase

| Fase | Diagnóstico | Implementación | Revisión | Cierre |
|---|---|---|---|---|
| 0 | `@explore` | `@general` con apoyo backend/frontend | `@code-reviewer` | `@general` |
| 1 | `@explore` | `@backend-spring` | `@code-reviewer` | `@general` |
| 2 | `@explore` | `@backend-spring` + `@frontend-react` | `@code-reviewer` | `@general` |
| 3 | `@explore` | backend + frontend | `@code-reviewer` | `@general` |
| 4 | `@explore` | `@frontend-react` con apoyo backend | `@code-reviewer` | `@general` |
| 5 | `@explore` | `@frontend-react` con apoyo backend | `@code-reviewer` | `@general` |
| 6 | `@explore` | backend + frontend | `@code-reviewer` | `@general` |
| 7 | `@explore` | `@backend-spring` con apoyo frontend | `@code-reviewer` | `@general` |
| 8 | `@explore` | `@backend-spring` | `@code-reviewer` | `@general` |
| 9 | `@explore` | `@frontend-react` | `@code-reviewer` | `@general` |
| 10 | `@explore` | `@general` coordina todos | `@code-reviewer` | `@general` |

## 0.6 Condiciones para detener una fase

La ejecución debe detenerse cuando ocurra cualquiera de estos casos:

- una decisión funcional pendiente cambia el modelo de datos;
- una migración puede destruir o reinterpretar datos existentes;
- una prueba de concurrencia es inestable;
- el agente necesita cambiar un contrato público no previsto;
- aparecen cambios no relacionados en el diff;
- el árbol Git no está limpio y no se puede separar el trabajo.

El agente debe reportar el bloqueo con:

```text
causa
impacto
opciones
recomendación
decisión requerida
```

---


## 1. Objetivo

Corregir los problemas de consistencia de inventario y kardex, estabilizar el flujo de compras y lotes, y rediseñar el flujo operativo del POS para que cada atención se inicie desde una mesa configurada, sin cambiar innecesariamente los contratos existentes.

El plan prioriza primero integridad de datos y concurrencia, después comportamiento funcional y finalmente UX, rendimiento y cobertura de pruebas.

---

## 2. Alcance

### Incluido

- Corrección del descuento FIFO de insumos y productos.
- Protección frente a descuentos concurrentes.
- Definición de una única fuente de verdad para el stock.
- Valorización correcta de entradas y salidas del kardex.
- Corrección del costo de productos de inventario directo.
- Ajustes del flujo de compras y creación de lotes.
- Corrección responsive del asistente de nueva compra.
- Selector inicial de mesas al ingresar al POS.
- POS asociado a una mesa específica.
- Recuperación del pedido activo de una mesa.
- Eliminación del selector de mesa dentro de “Armando pedido”.
- Carrito y pedido aislados por mesa.
- Sincronización del POS con cocina.
- Cobro, cierre del pedido y liberación de mesa.
- Corrección de N+1 en productos, pedidos, cocina y ventas.
- Paginación progresiva de listados grandes.
- Pruebas unitarias, de integración y E2E.

### Fuera de alcance inicial

- Rediseño completo del dominio de inventario.
- Sustitución total de `MovimientoInventario`.
- División de cuentas avanzada.
- Reservas parciales de stock por ingrediente sin una decisión funcional previa.
- Reemplazo de polling por WebSocket.
- Refactor general de `ERPContext`.

---

## 3. Principios de implementación

1. Mantener endpoints, DTOs y respuestas actuales cuando sea posible.
2. Aplicar migraciones Flyway incrementales. No modificar migraciones ya ejecutadas.
3. Mantener lotes como fuente real de stock durante esta implementación.
4. Ejecutar movimientos de lote, kardex, venta, caja, pedido y mesa dentro de transacciones atómicas.
5. Evitar lógica de stock duplicada entre entidades, servicios y frontend.
6. No combinar correcciones funcionales con refactors no relacionados.
7. Cada fase debe cerrar con pruebas y criterios de aceptación antes de continuar.

---

# Fase 0. Línea base y protección contra regresiones

## Objetivo

Congelar el comportamiento actual y crear una red mínima de seguridad antes de modificar inventario, ventas o pedidos.

## Backend

- Documentar los contratos actuales de:
  - `POST /api/v1/compras`
  - `POST /api/v1/pedidos/mesa/{idMesa}`
  - `POST /api/v1/pedidos/{id}/detalles`
  - `POST /api/v1/pedidos/{id}/enviar-cocina`
  - `GET /api/v1/pedidos/mesa/{idMesa}/activo`
  - `POST /api/v1/cajas/pedidos/{idPedido}/cobrar`
  - `GET /api/v1/movimientos-inventario`
- Crear fixtures para:
  - un insumo con dos lotes;
  - un producto de inventario directo con dos lotes;
  - una mesa disponible;
  - una mesa con pedido activo;
  - un pedido con producto preparado;
  - un pedido con producto directo.
- Activar estadísticas de Hibernate exclusivamente en tests o incorporar un contador de consultas.

## Frontend

- Registrar el comportamiento actual de:
  - apertura del POS;
  - selección de mesa;
  - creación de pedido;
  - envío a cocina;
  - emisión de precuenta;
  - navegación a caja.
- Añadir pruebas básicas de humo para `POS`, `Purchases`, `Kardex` y `Tables`.

## Criterios de aceptación

- Los contratos actuales quedan registrados.
- Existe una prueba reproducible para cada flujo crítico.
- Las pruebas existentes permanecen en verde.

---

# Fase 1. Correcciones críticas de inventario y FIFO

## Objetivo

Eliminar errores que pueden bloquear descuentos válidos o producir stock incorrecto bajo concurrencia.

## Cambios

### 1.1 Corregir selección FIFO

Revisar:

- `LoteInsumoRepository`
- `LoteProductoRepository`

La consulta debe seleccionar lotes con cantidad disponible mayor que cero, ordenados por:

1. fecha de vencimiento;
2. fecha de ingreso;
3. identificador estable.

No debe exigir que cada lote individual cubra toda la cantidad solicitada.

### 1.2 Bloqueo de lotes

Agregar lectura con `PESSIMISTIC_WRITE` en las consultas utilizadas por:

- `LoteInsumoService.descontarFifo`
- `LoteProductoService.descontarFifo`

Los lotes seleccionados deben permanecer bloqueados hasta finalizar la transacción de cobro.

### 1.3 Control optimista

Agregar `@Version` a:

- `LoteInsumo`
- `LoteProducto`

Crear una nueva migración Flyway para las columnas de versión.

### 1.4 Unificar la fuente de stock

Mantener temporalmente como fuente real:

- `lote_insumo.cantidad_disponible`
- `lote_producto.cantidad_disponible`

Eliminar del flujo funcional cualquier intento de persistir `Insumo.stock` cuando esté definido mediante `@Formula`.

No agregar todavía una segunda columna física de stock.

### 1.5 Reglas transaccionales

Verificar que el cobro completo se ejecute dentro de una única transacción:

- validar pedido;
- generar venta;
- descontar lotes;
- registrar consumos;
- registrar kardex;
- registrar pagos;
- registrar caja;
- cerrar pedido;
- liberar mesa.

Ante cualquier error, ninguna operación parcial debe persistir.

## Pruebas

- Lote con cantidad exacta.
- Cantidad distribuida entre varios lotes.
- Lote agotado.
- Lote vencido.
- Lote anulado.
- Stock insuficiente.
- Dos cobros concurrentes sobre el mismo lote.
- Rollback si falla el registro de pago después del descuento.

## Criterios de aceptación

- FIFO consume correctamente uno o varios lotes.
- No existe stock negativo.
- Dos cobros concurrentes no producen pérdida de actualización.
- Un fallo revierte lote, kardex, venta, caja, pedido y mesa.

---

# Fase 2. Kardex y valorización real

## Objetivo

Asegurar que cada movimiento represente correctamente cantidad, stock y valor económico.

## Reglas

### Entradas por compra

Registrar:

- tipo de recurso;
- recurso;
- lote;
- cantidad;
- stock anterior;
- stock nuevo;
- costo unitario;
- valor total de entrada;
- referencia de compra;
- usuario;
- fecha y hora.

### Salidas por venta

Registrar:

- cantidad negativa o tipo explícito de salida;
- stock anterior;
- stock nuevo;
- costo real de los lotes consumidos;
- referencia de venta y pedido;
- lote o trazabilidad del consumo;
- usuario;
- fecha y hora.

El importe mostrado en el kardex para una venta representa costo de inventario, no precio cobrado al cliente.

### Productos preparados

El costo debe provenir de:

- receta vigente;
- cantidades de insumos;
- costo real o costo promedio definido para cada insumo;
- extras consumidos.

### Inventario directo

Eliminar el cálculo fijo del 40 % del precio de venta.

El costo de salida debe provenir de los lotes realmente consumidos por FIFO.

### Saldo valorizado

Definir una fórmula única y documentada. Recomendación:

- valor de existencias posterior al movimiento;
- basado en costo promedio o suma valorizada de lotes vigentes.

No mezclar en un mismo campo:

- valor del movimiento;
- saldo valorizado posterior.

Si el contrato actual solo permite un campo, conservarlo y documentar exactamente su significado. La ampliación del DTO debe hacerse de forma compatible.

## Backend

Revisar:

- `MovimientoInventario`
- `MovimientoInventarioService`
- `MovimientoInventarioRepository`
- `CompraService`
- `VentaService`
- `LoteInsumoService`
- `LoteProductoService`
- `ConsumoInsumoVenta`

Añadir índices por:

- recurso y fecha;
- tipo de recurso y fecha;
- referencia;
- lote.

## Frontend

En `Kardex.tsx` mostrar de forma explícita:

- `Valor de entrada`
- `Costo de salida`
- `Stock: anterior → nuevo`
- lote;
- vencimiento;
- documento relacionado;
- usuario.

Formatear moneda de forma legible, conservando precisión interna de cuatro decimales cuando corresponda.

## Pruebas

- Compra de un lote.
- Venta parcial.
- Venta que cruza dos lotes con costos distintos.
- Anulación de venta.
- Anulación de compra no consumida.
- Ajuste de salida.
- Consistencia entre suma de lotes y stock mostrado.
- Consistencia entre consumos y movimientos.

## Criterios de aceptación

- El kardex coincide con el stock real.
- El costo de salida de inventario directo coincide con los lotes consumidos.
- Cada movimiento tiene trazabilidad hacia su operación origen.
- El usuario distingue precio de venta de costo de inventario.

---

# Fase 3. Compras y lotes

## Objetivo

Consolidar el ingreso de inventario y corregir la experiencia del asistente de compras.

## Backend

### Validaciones

Cada detalle debe contener exactamente uno de:

- `idInsumo`
- `idProducto`

Validar:

- cantidad mayor que cero;
- precio unitario mayor o igual que cero;
- producto permitido para compra;
- fecha de vencimiento según configuración;
- número de lote no vacío cuando sea obligatorio;
- proveedor existente y activo.

### Lotes

Una compra registrada debe crear lotes y movimientos de inventario dentro de la misma transacción.

Definir comportamiento para recursos sin vencimiento:

- permitir `fechaVencimiento = null`;
- no inventar fechas artificiales.

Los lotes cuya fecha ya venció deben rechazarse o requerir una acción administrativa explícita. No deben ingresar silenciosamente como stock utilizable.

### Anulación

Permitir anulación solo cuando las cantidades de los lotes originados por la compra no hayan sido consumidas.

Registrar movimientos inversos con una semántica consistente:

- `ENTRADA_ANULACION`, o
- `DEVOLUCION_COMPRA`.

Usar una sola nomenclatura en todo el sistema.

## Frontend

En `Purchases.tsx`:

- ampliar el modal;
- eliminar overflow;
- usar grid responsive;
- mantener el botón agregar dentro de la cuadrícula;
- cambiar `Qty` por `Cantidad`;
- deshabilitar `Siguiente` sin líneas válidas;
- mostrar recursos agregados en tabla;
- calcular subtotal por línea y total;
- mostrar errores junto al campo correspondiente.

Estructura recomendada:

```text
Tipo | Recurso | Cantidad | Precio unitario | Vencimiento | Agregar
```

Tabla posterior:

```text
Recurso | Tipo | Cantidad | Precio | Vencimiento | Subtotal | Acción
```

## Pruebas

- Compra de insumo.
- Compra de producto directo.
- Compra mixta.
- Recurso sin vencimiento.
- Vencimiento inválido.
- Línea sin recurso.
- Línea con insumo y producto simultáneos.
- Rollback si falla una línea.
- Anulación permitida.
- Anulación rechazada por consumo parcial.

## Criterios de aceptación

- No se crea una compra parcial.
- Todo ingreso genera lote y kardex.
- El modal funciona sin desbordamiento en resoluciones comunes.
- No es posible avanzar sin recursos válidos.

---

# Fase 4. Selector operativo de mesas al abrir el POS

## Objetivo

Hacer que el flujo de atención comience con una mesa y eliminar la selección tardía dentro del carrito.

## Rutas frontend

Crear o separar:

```text
/pos
/pos/mesas/:idMesa
```

### `/pos`

Mostrar las mesas configuradas en el módulo administrativo, con una presentación operativa reducida.

Información mínima:

- número o nombre;
- estado actual;
- capacidad;
- zona;
- pedido activo, cuando exista;
- total o tiempo transcurrido, si el contrato ya lo permite;
- acción principal.

No mostrar:

- botón editar;
- mensajes administrativos;
- configuración interna;
- controles de mantenimiento.

### Acciones por estado

- `DISPONIBLE` → `Atender`
- `ATENCION` → `Continuar pedido`
- `EN_COCINA` → `Ver pedido`
- `SERVIDO` → `Continuar / Emitir cuenta`
- `CUENTA` → `Ir a cobrar`
- `BLOQUEADA` → sin acción operativa

## Backend

Reutilizar:

- `GET /api/v1/mesas`
- `GET /api/v1/pedidos/mesa/{idMesa}/activo`

Evitar agregar un endpoint nuevo salvo que la pantalla requiera demasiadas llamadas.

Si se requiere optimización, agregar una proyección compatible para obtener mesas con resumen de pedido activo en una sola consulta.

## Concurrencia

Al atender una mesa disponible:

- bloquear o validar la mesa;
- comprobar nuevamente que no exista otro pedido activo;
- crear o recuperar el pedido;
- actualizar estado de la mesa.

Debe existir una restricción funcional para impedir dos pedidos activos principales en la misma mesa.

## Pruebas

- Mesa disponible.
- Mesa con pedido borrador.
- Mesa en cocina.
- Mesa en cuenta.
- Mesa bloqueada.
- Dos usuarios intentando atender la misma mesa.
- Refresco de navegador con pedido activo.

## Criterios de aceptación

- El POS no abre directamente en el catálogo sin mesa.
- La acción principal corresponde al estado real.
- No se crean dos pedidos activos para una mesa.

---

# Fase 5. POS específico por mesa

## Objetivo

Asociar navegación, carrito y pedido a una mesa concreta.

## Frontend

En `/pos/mesas/:idMesa`:

- leer `idMesa` desde la ruta;
- cargar datos de la mesa;
- cargar pedido activo;
- cargar detalles existentes;
- reconstruir el carrito;
- mostrar la mesa como información fija.

Eliminar del panel “Armando pedido”:

- selector de mesa;
- estado local `selectedMesaId`;
- validación tardía de selección;
- carga exclusiva de mesas disponibles.

Mantener:

- cliente genérico;
- selección o creación de cliente;
- productos;
- variantes;
- extras;
- observaciones;
- totales.

### Encabezado recomendado

```text
Mesa 12 · Zona Terraza
Pedido #128 · En atención
```

Agregar una acción controlada para regresar al selector. No permitir cambiar de mesa reemplazando el identificador del pedido de forma silenciosa.

## Carrito por mesa

El carrito global no debe mezclarse entre mesas.

Opción mínima:

- derivar el carrito del pedido activo del backend;
- mantener un estado local por pantalla;
- persistir cambios al pedido cuando corresponda.

Si se necesita persistencia temporal, usar una clave por mesa:

```text
pos-cart:{idMesa}
```

El backend sigue siendo la fuente de verdad.

## Backend

Mantener `idMesa` asociado al pedido.

Al entrar:

- si existe pedido activo, devolverlo;
- si no existe, no crear uno hasta la primera acción definida.

Decisión recomendada:

- crear el pedido al presionar `Atender`, no al agregar el primer producto;
- mantenerlo en `BORRADOR_ATENCION`.

## Pruebas

- Abrir mesa sin pedido.
- Recuperar pedido existente.
- Agregar detalle.
- Modificar cantidad.
- Eliminar detalle permitido.
- Cambiar cliente.
- Recargar navegador.
- Abrir dos pestañas con mesas distintas.
- Evitar mezcla de carritos.

## Criterios de aceptación

- Cada pantalla POS pertenece a una sola mesa.
- La mesa no puede cambiarse desde el carrito.
- El pedido activo se recupera después de recargar.

---

# Fase 6. Cocina y sincronización de estados

## Objetivo

Sincronizar POS, cocina, pedido y mesa con un flujo de estados único.

## Flujo

```text
BORRADOR_ATENCION
→ EN_COCINA
→ LISTO
→ SERVIDO
→ CUENTA
→ CERRADO
```

La mesa debe reflejar el estado operativo equivalente.

## Backend

Centralizar transiciones en políticas o servicios. Ningún controlador debe actualizar estados libremente sin pasar por validación.

Al enviar a cocina:

- validar que existan detalles;
- congelar o controlar edición;
- separar productos que requieren preparación;
- marcar productos directos según la regla actual;
- actualizar pedido y mesa en la misma transacción.

Si todos los productos son de inventario directo, conservar el salto automático únicamente si la regla está explícitamente probada.

## Frontend

Agregar polling focalizado:

- solo cuando existe pedido activo;
- intervalo entre 5 y 10 segundos;
- detener al cerrar, cancelar o salir de la pantalla;
- pausar cuando la pestaña no está visible, si la librería lo permite.

Actualizar:

- estado del pedido;
- estado de detalles;
- acción principal;
- estado de la mesa.

No hacer polling global de todos los pedidos desde todo el ERP.

## Pruebas

- Enviar pedido con producto preparado.
- Enviar pedido directo.
- Pedido mixto.
- Cocina inicia detalle.
- Cocina finaliza detalle.
- Todos los detalles listos.
- POS detecta cambio.
- Transición inválida rechazada.
- Cancelación según estado.

## Criterios de aceptación

- Cocina y POS muestran el mismo estado.
- No se ejecutan transiciones inválidas.
- El polling no continúa fuera de una atención activa.

---

# Fase 7. Precuenta, cobro y liberación de mesa

## Objetivo

Cerrar correctamente el ciclo operativo y garantizar que la mesa solo quede disponible después del cierre efectivo.

## Reglas

- La precuenta no descuenta stock.
- El cobro genera la venta.
- El cobro descuenta stock y genera kardex.
- El cobro registra pagos y caja.
- El cobro cierra el pedido.
- El cobro libera la mesa.
- Todo ocurre dentro de una sola transacción.

## Anulación de venta

Definir y aplicar:

- reversión de lotes consumidos;
- movimiento inverso de kardex;
- reversión o contramovimiento de caja;
- estado de venta;
- estado del pedido;
- estado de la mesa.

La mesa no debe liberarse o reocuparse de manera implícita sin una regla clara.

## Correlativos

Mantener la numeración exclusivamente en backend.

No aceptar `serie` ni `numero` controlados por cliente en rutas públicas de creación de venta.

Proteger la creación de correlativos para series no sembradas y escenarios concurrentes.

## Pruebas

- Pago único.
- Pago dividido.
- Monto insuficiente.
- Monto excedente y vuelto.
- Dos cobros concurrentes del mismo pedido.
- Fallo después de generar correlativo.
- Anulación de venta.
- Mesa liberada solo tras cierre.
- Pedido cerrado no cobrable nuevamente.

## Criterios de aceptación

- Una venta no se duplica.
- El stock se descuenta una sola vez.
- La mesa vuelve a disponible al cerrar correctamente.
- El correlativo no depende del frontend.

---

# Fase 8. Corrección de N+1 y rendimiento

## Objetivo

Eliminar consultas lineales en listados críticos sin alterar contratos HTTP.

## Productos

Corregir:

- `getAllProductos`
- `getProductosPadre`
- `getSkusByPadre`

Aplicar:

- `@EntityGraph` para `categoria` y `productoPadre`;
- consulta batch para stock, lotes y próximo vencimiento;
- consulta batch para `tieneSkus`;
- `tieneSkus = false` para SKU sin consulta.

## Pedidos y cocina

Cargar en bloque:

- detalles;
- extras;
- productos;
- variantes;
- mesa;
- cliente.

Evitar llamadas de repositorio dentro de `mapToDetailedResponse` o `toComandaResponse`.

## Ventas

Cargar en bloque:

- detalles;
- pagos;
- pedido;
- cliente;
- comprobante.

## Kardex

Agregar paginación y filtros por:

- tipo de recurso;
- recurso;
- tipo de movimiento;
- fecha;
- referencia.

Mantener temporalmente el endpoint actual si el frontend depende de él y añadir una variante paginada compatible.

## Pruebas

- Contar consultas para 1, 10 y 100 elementos.
- Verificar que el número de consultas se mantenga constante o acotado.
- Probar serialización con `open-in-view=false`.

## Criterios de aceptación

- Las consultas no crecen linealmente con el número de elementos.
- No aparecen `LazyInitializationException`.
- Los contratos de respuesta permanecen iguales.

---

# Fase 9. UX y consistencia visual

## Objetivo

Pulir las pantallas después de estabilizar la lógica.

## Kardex

- Etiquetas claras para entrada y salida.
- Fechas y horas legibles.
- Lote y vencimiento visibles.
- Documento relacionado.
- Filtros.
- Paginación.
- Estado vacío útil.

## Compras

- Modal responsive.
- Alineación de etiquetas e inputs.
- Tabla de recursos agregados.
- Resumen total.
- Validación contextual.

## Selector de mesas

- Tarjetas compactas.
- Estado visible.
- Acción única por tarjeta.
- Jerarquía visual consistente.
- Sin controles administrativos.

## POS

- Mesa fija y visible.
- Cliente separado de la mesa.
- Estado del pedido visible.
- Botón principal contextual.
- Deshabilitados con explicación.
- Evitar mensajes ambiguos como “Precio no configurado” sin acción administrativa asociada.

## Criterios de aceptación

- No existe overflow en 1280 × 720 ni resoluciones superiores.
- El usuario identifica en qué mesa trabaja.
- El usuario distingue guardar, enviar a cocina, servir y cobrar.

---

# Fase 10. Cobertura final y despliegue

## Backend

Agregar pruebas de integración para:

- compra → lote → kardex;
- mesa → pedido → cocina → cuenta → cobro;
- venta → FIFO → kardex → caja;
- anulación;
- concurrencia;
- N+1.

Preferir Testcontainers con MariaDB para consultas, locks y transacciones reales.

## Frontend

Agregar pruebas:

- selector de mesas;
- navegación a POS por mesa;
- recuperación de pedido;
- carrito aislado por mesa;
- polling;
- asistente de compras;
- kardex.

## Despliegue

Orden:

1. respaldo de base de datos;
2. desplegar migraciones;
3. desplegar backend;
4. ejecutar smoke tests;
5. desplegar frontend;
6. comprobar compra, POS, cocina, caja y kardex;
7. revisar logs y métricas.

## Rollback

- Mantener migraciones aditivas.
- No eliminar columnas en el mismo despliegue.
- Conservar compatibilidad temporal de DTOs.
- Preparar rollback de frontend y backend.
- No revertir migraciones con datos sin script explícito.

---

# 4. Dependencias entre fases

```text
Fase 0
  ↓
Fase 1 → Fase 2 → Fase 3
  ↓
Fase 4 → Fase 5 → Fase 6 → Fase 7
  ↓
Fase 8
  ↓
Fase 9
  ↓
Fase 10
```

La Fase 8 puede ejecutarse parcialmente en paralelo, pero no debe mezclarse con cambios funcionales complejos en los mismos servicios.

---

# 5. Decisiones que deben cerrarse antes de implementar

1. ¿Los productos sin vencimiento permiten `fechaVencimiento = null`?
2. ¿El pedido se crea al pulsar `Atender` o al agregar el primer producto?
3. ¿Se reservará stock al enviar a cocina o se mantendrá descuento al cobrar?
4. ¿Una venta anulada reabre el pedido o solo genera una operación inversa?
5. ¿La mesa anulada/cancelada vuelve siempre a `DISPONIBLE`?
6. ¿Se mantiene polling o se planifica WebSocket en una etapa futura?
7. ¿El kardex mostrará dos campos distintos para valor del movimiento y saldo valorizado?

## Decisiones recomendadas para la primera implementación

- Permitir vencimiento nulo según tipo de recurso.
- Crear pedido al pulsar `Atender`.
- Mantener descuento al cobrar durante esta fase.
- No implementar reserva de stock todavía.
- Usar polling focalizado de 5 a 10 segundos.
- Mantener lotes como única fuente de stock.
- Separar visualmente valor del movimiento y saldo valorizado.

---

# 6. Definición global de terminado

El trabajo se considera terminado cuando:

- FIFO funciona con múltiples lotes y concurrencia.
- No se genera stock negativo.
- El kardex coincide con los lotes.
- El costo de inventario directo no depende de un porcentaje fijo.
- Una compra genera lotes y movimientos atómicamente.
- El modal de compras no se desborda.
- El POS comienza con un selector de mesas.
- Cada mesa abre su propio POS y pedido.
- No existe selector de mesa dentro de “Armando pedido”.
- Cocina y POS mantienen estados consistentes.
- El cobro genera venta, kardex, caja, cierre y liberación de mesa en una transacción.
- Los listados críticos no presentan N+1.
- Las pruebas de integración y E2E cubren el flujo principal.



# 6.1 Prompt inicial de coordinación

```text
@general coordina la ejecución de este plan usando únicamente:

- @explore
- @backend-spring
- @frontend-react
- @code-reviewer
- @general

Responsabilidades:
- @explore diagnostica y no edita.
- @backend-spring implementa backend, BD, migraciones y pruebas Java/MariaDB.
- @frontend-react implementa frontend, Vitest y Playwright.
- @code-reviewer revisa y autoriza el cierre.
- @general coordina, valida y crea commits.

Primero ejecuta:
1. git status --short
2. git log --oneline -15
3. git diff --stat

Clasifica:
- A1 Correlativos
- A2 Precio null POS
- A3 Playwright
- N+1 productos
- GET /productos/{id}
- contratos OpenAPI

Estados:
COMPLETADO, EN REVISIÓN, PENDIENTE, BLOQUEADO o NO APLICA.

No edites ni hagas commit todavía.
Entrega la siguiente tarea exacta y el agente que debe ejecutarla.
```

---

# 7. Prompts operativos por fase

Estos prompts se ejecutan uno por uno. No enviar el plan completo a un único agente para que cambie todo el sistema.

## Prompt de exploración de fase

```text
@explore analiza únicamente la Fase {N}: {NOMBRE}.

No edites.

Entrega:
1. estado actual;
2. archivos y módulos involucrados;
3. flujo funcional y técnico;
4. qué ya está implementado;
5. qué falta;
6. riesgos;
7. pruebas existentes;
8. cambio mínimo recomendado.
```

## Prompt de auditoría de fase

```text
@code-reviewer audita la Fase {N}: {NOMBRE}.

No edites.

1. Identifica qué ya está implementado.
2. Compara código, BD, contratos y pruebas con los criterios del plan.
3. Clasifica:
   - completo;
   - parcial;
   - ausente;
   - incorrecto;
   - deuda fuera de alcance.
4. Señala riesgos de:
   - transacciones;
   - concurrencia;
   - N+1;
   - nulabilidad;
   - integridad referencial;
   - compatibilidad de contratos.
5. Propón el cambio mínimo por archivos.
6. Entrega criterios verificables de cierre.
```

## Prompt backend de fase

```text
@backend-spring implementa únicamente la Fase {N}: {NOMBRE}.

Usa el diagnóstico aprobado de @code-reviewer.

Reglas:
- no cambies frontend;
- no modifiques migraciones ya aplicadas;
- mantén contratos existentes cuando sea posible;
- usa transacciones atómicas;
- agrega pruebas unitarias e integración MariaDB;
- no ocultes errores con valores por defecto;
- no hagas commit.

Al terminar entrega:
- causa raíz;
- archivos;
- decisiones;
- pruebas ejecutadas;
- riesgos residuales.
```

## Prompt frontend de fase

```text
@frontend-react implementa únicamente la Fase {N}: {NOMBRE}.

Reglas:
- usa contratos OpenAPI vigentes;
- no dupliques reglas de negocio del backend;
- no uses any ni casts para ocultar nulabilidad;
- limita polling a la pantalla activa;
- agrega pruebas de integración UI o Playwright;
- ejecuta contracts:check, tsc, lint, build y tests;
- no hagas commit.
```

## Prompt de revisión final

```text
@code-reviewer revisa el cierre de la Fase {N}: {NOMBRE}.

No edites.

Verifica:
1. criterios de aceptación;
2. transacciones y rollback;
3. concurrencia;
4. contratos;
5. pruebas reales, no solo mocks;
6. ausencia de cambios fuera de alcance;
7. ausencia de regresiones.

Reporta solo hallazgos altos, medios o riesgos relevantes.
Si no existen, indica explícitamente: LISTO PARA COMMIT.
```

## Prompt de commit

```text
@general prepara el commit de la Fase {N}.

1. Muestra git status y diff stat.
2. Incluye solo archivos pertenecientes a la fase.
3. Excluye artefactos, reportes y cambios ajenos.
4. Ejecuta la verificación final mínima.
5. Crea un commit convencional.
6. Devuelve hash, mensaje y archivos incluidos.
```

---

# 8. Tablero de seguimiento

Actualizar esta tabla después de cada ciclo:

| Bloque/Fase | Estado | Última evidencia | Hallazgos abiertos | Commit |
|---|---|---|---|---|
| A1 Correlativos | EN REVISIÓN | 53 tests verdes | control cliente, concurrencia, unicidad, integración | pendiente |
| A2 Precio null POS | EN REVISIÓN | unit tests verdes | falta integración UI real | pendiente |
| A3 Playwright | PENDIENTE | suite instalada | repetir tras A1/A2 | pendiente |
| Fase 0 | PENDIENTE |  |  |  |
| Fase 1 | PENDIENTE |  |  |  |
| Fase 2 | PENDIENTE |  |  |  |
| Fase 3 | PENDIENTE |  |  |  |
| Fase 4 | PENDIENTE |  |  |  |
| Fase 5 | PENDIENTE |  |  |  |
| Fase 6 | PENDIENTE |  |  |  |
| Fase 7 | PENDIENTE |  |  |  |
| Fase 8 | PARCIAL | N+1 productos corregido | pedidos, cocina, ventas, kardex | confirmar commit |
| Fase 9 | PENDIENTE |  |  |  |
| Fase 10 | PENDIENTE |  |  |  |

---

# 9. Regla final de éxito

El plan se considera ejecutado con éxito cuando:

```text
- todas las fases están en COMPLETADO;
- no hay hallazgos altos o medios;
- backend unitario e integración MariaDB están verdes;
- frontend contracts, tsc, lint, build y tests están verdes;
- Playwright E2E no registra 5xx ni errores JS;
- las migraciones funcionan desde una base existente;
- los flujos compra → lote → kardex y mesa → POS → cocina → cobro están probados;
- cada fase tiene commit aislado y trazable.
```
