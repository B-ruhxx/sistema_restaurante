# Analisis tecnico integral del Sistema Restaurante

**Fecha del analisis:** 2026-07-16  
**Alcance:** codigo fuente, configuracion, despliegue, documentacion y pruebas presentes en el repositorio.  
**Metodo:** inspeccion estatica del repositorio. No se levantaron contenedores ni se ejecutaron pruebas durante la elaboracion de este informe.

## 1. Resumen ejecutivo

El repositorio implementa un **ERP y POS para restaurante**. Cubre catalogo, recetas, compras, lotes, inventario, mesas, pedidos, cocina, precuentas, caja, ventas, reportes, seguridad, auditoria y configuracion empresarial.

La solucion esta separada en dos aplicaciones:

- `backend/`: API REST con Spring Boot 3.1 y Java 17. Aplica las reglas de negocio, persiste datos en MariaDB, conserva sesiones JWT activas en Redis y almacena archivos en `uploads/`.
- `frontend/`: aplicacion SPA en React 19, TypeScript y Vite. Consume la API, mantiene la experiencia de POS/ERP y usa React Query para cache y sincronizacion de datos.

En contenedores, la comunicacion principal es:

```text
Navegador
  |
  +--> Frontend Nginx (puerto 80, archivos React compilados)
  |        |
  |        +--> API REST /api/v1 (backend:8080, accesible desde el navegador)
  |
  +--> Backend Spring Boot (puerto 8080)
             |
             +--> MariaDB (datos de negocio y auditoria)
             +--> Redis (token JWT vigente por empleado)
             +--> uploads/ (archivos locales publicados por la API)
```

El backend es la fuente de verdad de reglas, permisos, estados, contratos HTTP y datos. El frontend solo presenta datos y solicita operaciones por HTTP; sus permisos visuales no sustituyen a los permisos del servidor.

## 2. Estructura de la raiz

| Ruta | Proposito | Relacion con el sistema |
|---|---|---|
| `.env` | Variables locales de Docker, entre ellas secretos requeridos. | `docker-compose.yml` exige `DB_ROOT_PASSWORD` y `JWT_SECRET`. No debe versionarse ni incluirse en informes. |
| `.git/` | Historial y metadatos Git. | No participa en tiempo de ejecucion. |
| `.gitignore` | Reglas para excluir secretos, compilados y archivos locales. | Protege contra incluir artefactos y configuracion sensible en Git. |
| `AGENTS.md` | Guia operativa del repositorio. | Define comandos, contratos, migraciones y convenciones de trabajo. |
| `docker-compose.yml` | Orquestacion de MariaDB, Redis, backend y frontend. | Es la entrada para levantar el sistema completo. |
| `backend/` | API, modelo de dominio, persistencia, migraciones y pruebas Java. | Atiende el frontend y coordina los recursos de datos. |
| `frontend/` | SPA, UI, cliente HTTP, tipos, pruebas web y configuracion Nginx. | Es la interfaz usada por empleados y administradores. |
| `docs/` | Planes tecnicos y de alineacion de contratos. | Son guias de trabajo; el codigo y OpenAPI vigente prevalecen sobre planes antiguos. |
| `scripts/` | Validaciones de aceptacion manuales mediante API. | Requieren backend ejecutandose y credenciales validas. |
| `uploads/` | Almacenamiento local persistente de imagenes/archivos. | Se monta como volumen en el contenedor backend y se publica bajo `/api/uploads/**`. |
| `ANALISIS_SISTEMA.md` | Este informe. | Documento de consulta de arquitectura, flujos y riesgos. |

### 2.1 Archivos de infraestructura de la raiz

| Archivo | Funcion concreta |
|---|---|
| `docker-compose.yml` | Declara cuatro servicios: `db` (MariaDB 10.11), `redis` (Redis 7), `backend` y `frontend`. Expone 3306, 6379, 8080 y 80; espera health checks de BD/Redis antes de arrancar backend; monta `./uploads` en `/app/uploads`. |
| `scripts/validate-fase12-acceptance.mjs` | Script Node que inicia sesion, crea datos temporales y comprueba compra, lotes FIFO, pedido, venta y anulacion mediante la API. Es una prueba de aceptacion destructiva sobre la instancia indicada por `API_BASE_URL`; no debe ejecutarse contra produccion. Algunos campos usados por el script deben contrastarse con el OpenAPI actual antes de usarlo como validacion contractual. |
| `docs/PLAN.md` | Plan extenso por fases para estabilizar inventario, lotes, mesas, POS, cocina, caja y rendimiento. Registra intenciones y riesgos historicos; no confirma que cada fase este aplicada. |
| `docs/FRONTEND_PLAN.md` | Protocolo para alinear adaptadores frontend con OpenAPI. Indica que `frontend/src/api/generated/openapi-types.ts` es generado y no debe editarse manualmente. |

## 3. Ejecucion, configuracion y dependencias externas

### 3.1 Servicios Docker

| Servicio | Imagen o construccion | Puerto host | Datos persistentes | Responsabilidad |
|---|---|---:|---|---|
| `db` | `mariadb:10.11` | 3306 | volumen `db_data` | Tablas operativas, seguridad, auditoria y reportes. |
| `redis` | `redis:7-alpine` | 6379 | volumen `redis_data` con AOF | Conserva el hash del token JWT vigente para cada empleado. |
| `backend` | `backend/Dockerfile` | 8080 | `./uploads:/app/uploads` | API Spring Boot, Flyway, seguridad, reglas y archivos. |
| `frontend` | `frontend/Dockerfile` | 80 | no aplica | Compila React y sirve el resultado con Nginx. |

### 3.2 Variables relevantes

| Variable | Consumidor | Uso |
|---|---|---|
| `DB_ROOT_PASSWORD` | Docker/MariaDB/backend | Contrasena root de MariaDB y password usado por backend en Compose. |
| `JWT_SECRET` | backend | Clave HMAC de JWT. Debe tener al menos 256 bits. |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | backend | Conexion de base de datos. |
| `SPRING_DATA_REDIS_HOST`, `SPRING_DATA_REDIS_PORT` | backend | Conexion a Redis. |
| `JWT_EXPIRATION` | backend | Duracion del token; por defecto 86400000 ms. |
| `APP_LOG_LEVEL` | backend | Nivel de log de `com.restaurante`; por defecto `INFO`. |
| `VITE_API_URL` | frontend, en compilacion | Base de la API, normalmente `http://localhost:8080/api/v1`. |
| `OPENAPI_USE_BASELINE` | scripts frontend | Fuerza usar `backend/openapi-baseline.json` al generar contratos. |

### 3.3 Comandos habituales

```powershell
# Sistema completo, desde la raiz
docker compose up --build

# Backend local, desde backend/
mvn spring-boot:run
mvn test

# Frontend local, desde frontend/
npm run dev
npm run lint
npm run build
npm test
npm run contracts:check
```

`backend/src/main/resources/application.properties` obliga a validar el esquema con Hibernate (`ddl-auto=validate`) y habilita Flyway. Por tanto, los cambios de estructura de BD deben ser nuevas migraciones SQL; no se debe depender de que JPA cree columnas o tablas automaticamente.

## 4. Backend: arquitectura y archivos

### 4.1 Tecnologias

- Java 17 y Spring Boot 3.1.2.
- Spring Web, Validation, Security, Data JPA, AOP y Data Redis.
- MariaDB como base de datos relacional.
- Flyway para versionar el esquema.
- JJWT para tokens HMAC-SHA JWT.
- springdoc-openapi para `/v3/api-docs` y Swagger.
- JUnit, Mockito, MockMvc y Spring Security Test.

Estas dependencias estan declaradas en `backend/pom.xml`. `backend/Dockerfile` compila con Maven y ejecuta la aplicacion con un runtime Java 17.

### 4.2 Arbol funcional

```text
backend/
  Dockerfile                         Imagen ejecutable de la API
  pom.xml                            Dependencias Maven y Java 17
  openapi-baseline.json              Respaldo del contrato OpenAPI
  src/
    main/
      java/com/restaurante/
        RestauranteApplication.java  Arranque de Spring
        aspect/                      Auditoria transversal
        config/                      Seguridad, CORS, Swagger, archivos y propiedades
        controller/                  Adaptadores HTTP REST
        dto/                         Requests, responses, validadores y mappers
        entity/                      Entidades JPA y enums del dominio
        exception/                   Errores HTTP uniformes
        repository/                  Acceso a datos JPA y consultas especializadas
        security/                    JWT, UserDetails y filtros HTTP
        service/                     Casos de uso y transacciones
          policy/                    Reglas de estado y autorizacion de dominio
      resources/
        application.properties       Configuracion de Spring
        db/migration/                Migraciones Flyway
    test/java/com/restaurante/       Unitarias, web e integracion opcional
```

### 4.3 Inicio y recorrido de una solicitud

1. `RestauranteApplication.java` inicia Spring Boot, escanea paquetes y habilita la infraestructura de la aplicacion.
2. `CorrelationIdFilter.java` asigna o propaga un identificador de correlacion para seguir una solicitud en logs.
3. `RequestLoggingFilter.java` registra informacion operativa de la solicitud.
4. `JwtAuthenticationFilter.java` lee `Authorization: Bearer <token>` en las rutas protegidas.
5. `JwtTokenProvider.java` verifica firma y expiracion. `TokenWhitelistService.java` verifica en Redis que el hash del token aun sea el vigente del empleado.
6. `CustomUserDetailsService.java` carga al empleado, rol y permisos; Spring Security deja las authorities disponibles.
7. El controlador valida el DTO de entrada y delega al servicio correspondiente.
8. El servicio aplica politicas, usa repositorios y persiste entidades dentro de una transaccion cuando corresponde.
9. Un mapper transforma entidades a DTO de respuesta. Si ocurre un error, `GlobalExceptionHandler.java` lo convierte en `ApiErrorResponse` cuando aplica.
10. `AuditoriaAspect.java` intercepta operaciones de repositorio configuradas y registra datos de auditoria mediante `AuditoriaHelperService`.

### 4.4 Paquetes transversales

| Carpeta/archivo | Funcion |
|---|---|
| `RestauranteApplication.java` | Punto de entrada de la aplicacion. |
| `config/SecurityConfig.java` | Configura API stateless, CORS, CSRF deshabilitado, filtro JWT, rutas publicas y reglas de seguridad globales. |
| `config/SwaggerConfig.java` | Define metadatos de OpenAPI/Swagger. `/v3/api-docs` se deja publico para generar contratos. |
| `config/FileStorageConfig.java` | Registra la publicacion de `uploads/` bajo `/api/uploads/**`. |
| `config/AppProperties.java`, `SecurityProperties.java`, `StorageProperties.java` | Enlazan propiedades externas de aplicacion, JWT y almacenamiento. |
| `security/CustomUserDetails.java` | Adaptador de `Empleado` al modelo de autenticacion de Spring Security. |
| `security/CustomUserDetailsService.java` | Busca el usuario durante autenticacion y construye sus authorities. |
| `security/JwtTokenProvider.java` | Crea y valida JWT con sujeto, `jti` y expiracion. |
| `security/JwtAuthenticationFilter.java` | Inserta la autenticacion en el contexto de Spring si JWT y Redis son validos. |
| `security/CorrelationIdFilter.java` | Incluye el identificador de correlacion en cada solicitud. |
| `security/RequestLoggingFilter.java` | Registro HTTP de diagnostico. |
| `aspect/AuditoriaAspect.java` | Intercepta `save*` y `delete*` de repositorios para escribir auditoria. |
| `aspect/AuditoriaHelperService.java` | Persiste auditoria en una transaccion independiente. |
| `exception/GlobalExceptionHandler.java` | Traduce validacion, recurso inexistente, conflicto, acceso denegado y errores no controlados a HTTP. |
| `exception/ResourceNotFoundException.java` | Excepcion de recurso inexistente, usada para respuestas 404. |

### 4.5 Controladores y API REST

Todos los controladores estan bajo `backend/src/main/java/com/restaurante/controller/`. La base funcional es `/api/v1`. Salvo login, health, documentacion y lectura publica de uploads, las rutas requieren autenticacion JWT.

| Archivo controlador | Recurso o proceso | Operaciones principales |
|---|---|---|
| `AuthController.java` | Identidad | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`. |
| `HealthController.java` | Diagnostico | Estado general, BD y cache. |
| `CategoriaController.java` | Catalogo | CRUD de `/categorias` y cambio de estado. |
| `ClienteController.java` | Clientes | CRUD de `/clientes`. |
| `ProveedorController.java` | Proveedores | CRUD de `/proveedores`. |
| `InsumoController.java` | Materias primas | CRUD de `/insumos`. |
| `ProductoController.java` | Productos padres y SKU | Padres, SKU, detalle, stock, lotes, creacion, edicion y cambio de estado. |
| `ExtraProductoController.java` | Extras | CRUD de `/extras`. |
| `ComboController.java` | Combos | CRUD de `/combos`. |
| `MetodoPagoController.java` | Medios de pago | CRUD de `/metodo-pagos` y listado de activos. |
| `MesaController.java` | Salon | CRUD, disponibilidad y apertura de pedido para una mesa. |
| `PedidoController.java` | Atencion | Crear pedido, detalle, cliente, envio a cocina, estado, cancelacion y consulta. |
| `CocinaController.java` | Produccion | Comandas y transiciones de pedido/detalle en cocina. |
| `PrecuentaController.java` | Cuenta previa | Emitir, consultar, anular/reabrir segun estado. |
| `CajaController.java` | Caja | Apertura, cierre, caja activa, movimientos, pedidos pendientes y cobro. |
| `VentaController.java` | Comprobantes | Registrar, pagar, listar, consultar y anular ventas. |
| `CompraController.java` | Abastecimiento | Registrar, listar, consultar y anular compras. |
| `InventarioController.java` | Ajustes | Registrar ajustes de inventario. |
| `MovimientoInventarioController.java` | Kardex | Consultar movimientos globales, por insumo o por producto. |
| `ReportesController.java` | Analitica | Alertas de stock/vencimiento, ventas, compras, utilidad, populares y resumen financiero. |
| `ConfiguracionEmpresaController.java` | Parametros empresa | Lectura y actualizacion de configuracion. |
| `EmpleadoController.java` | Personal | CRUD, sesiones y actividad de empleados. |
| `RolController.java` y `PermisoController.java` | Autorizacion | Administracion de roles y permisos. |
| `AuditoriaController.java` | Trazabilidad | Consultas de auditoria por tabla o generales. |
| `SecurityController.java` | Seguridad operativa | Sesiones, alertas, resolucion de alertas y cierre de sesiones. |
| `UploadController.java` | Archivos | Subir archivo, importar desde URL, obtener URL y eliminar. |

Los controladores son adaptadores de transporte: no deben concentrar logica de negocio. Su interrelacion normal es `Controller -> Service -> Repository -> Entity`, y `DTO/Mapper` en la frontera HTTP.

### 4.6 Servicios y politicas

`service/` contiene los casos de uso. En general, cada archivo `XService.java` es propietario de las reglas de la entidad/agregado `X`; cada `XRepository.java` persiste ese agregado.

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Autentica con BCrypt/Spring Security, crea JWT, invalida sesiones anteriores y sincroniza la whitelist Redis. |
| `TokenWhitelistService` | Guarda, valida y retira el hash de token vigente por empleado. |
| `CategoriaService`, `ClienteService`, `ProveedorService`, `InsumoService`, `ProductoService`, `ExtraProductoService`, `ComboService`, `MetodoPagoService` | CRUD y validaciones de los catalogos respectivos. |
| `MesaService` | Gestiona disponibilidad y apertura/control del pedido asociado a una mesa. |
| `PedidoService` | Crea pedidos, agrega detalles/extras, recalcula totales, modifica cliente y coordina estado con mesa/cocina. |
| `CocinaService` | Construye comandas y actualiza preparacion de pedido/detalles. |
| `PrecuentaService` | Congela una cuenta previa, recalcula importes y permite su reapertura segun politica. |
| `CajaService` | Abre/cierra caja, registra ingresos/egresos y coordina cobro de pedidos. |
| `VentaService` | Genera venta, pagos, consumos, salida de lotes, movimientos de caja e inventario, anulacion y cierre del pedido. |
| `CorrelativoDocumentoService` | Reserva serie y correlativo de comprobantes con bloqueo pesimista. |
| `CompraService` | Registra compras, detalles, lotes, costo promedio y entradas de kardex; puede anular si no se consumio el lote. |
| `LoteInsumoService`, `LoteProductoService` | Consultan y consumen inventario por FIFO; restauran cantidades cuando se anula una venta. |
| `MovimientoInventarioService` | Registra ajustes de salida y consulta el kardex. |
| `ReporteService` | Compone indicadores de operacion, compras, ventas y rentabilidad. |
| `ConfiguracionEmpresaService` | Lee y actualiza datos institucionales. |
| `EmpleadoService`, `RolService`, `PermisoService` | Mantienen personal, roles, contrasenas y permisos. |
| `AuditoriaService`, `AlertaSeguridadService` | Exponen trazabilidad y alertas de seguridad. |
| `UploadService` | Valida/guarda/elimina adjuntos y descarga archivos remotos solicitados por URL. |

Las clases de `service/policy/` separan reglas de transicion y validacion: `PedidoPolicy`, `CocinaPolicy`, `VentaPolicy`, `CajaPolicy`, `InventarioPolicy` y `ProductoPolicy`. Los servicios las invocan antes de modificar estados o inventario.

### 4.7 Modelo de datos: entidades y relaciones

Las entidades se ubican en `entity/`. Cada archivo corresponde a una tabla o agregado JPA y su repository del mismo nombre es su puerta de persistencia. Las relaciones principales son las siguientes.

| Area | Entidades | Relacion y finalidad |
|---|---|---|
| Seguridad | `Empleado`, `Rol`, `Permiso`, `SesionUsuario`, `AlertaSeguridad`, `Auditoria` | Un empleado pertenece a un rol; un rol se asocia a permisos. Las sesiones registran acceso y Redis mantiene el token vigente. Auditoria registra cambios. |
| Configuracion | `ConfiguracionEmpresa` | Datos corporativos usados por configuracion y comprobantes. |
| Catalogo | `Categoria`, `Cliente`, `Proveedor`, `MetodoPago`, `Insumo`, `Producto`, `ExtraProducto`, `ComboProducto`, `ComboDetalle`, `RecetaProducto` | Productos pueden ser padres o SKU. Un SKU puede ser preparado (usa receta) o de inventario directo (usa lotes). Combos contienen productos; recetas relacionan producto preparado e insumos. |
| Inventario y compra | `CompraInsumo`, `DetalleCompraInsumo`, `LoteInsumo`, `LoteProducto`, `MovimientoInventario`, `AjusteInventario` | Una compra tiene detalles y genera lotes. Los lotes son la fuente operativa de stock y alimentan el kardex. |
| Salon y cocina | `Mesa`, `Pedido`, `DetallePedido`, `PedidoExtra`, `PedidoEstadoHistorial`, `Precuenta` | Una mesa puede tener un pedido activo. Un pedido tiene detalles, extras, historial de estados y, antes del cobro, precuenta. |
| Caja y ventas | `Caja`, `MovimientoCaja`, `Venta`, `DetalleVenta`, `VentaPago`, `ConsumoInsumoVenta`, `CorrelativoDocumento` | Caja registra dinero; venta copia el pedido, guarda pagos y consumos; correlativo entrega numeracion segura por comprobante. |

Detalles relevantes:

- `Producto` padre organiza variantes/SKU y no se vende ni compra directamente. El SKU es el articulo operativo.
- `Insumo.stock` se calcula mediante `@Formula` a partir de lotes disponibles; no debe tratarse como una columna persistente independiente.
- `LoteInsumo` y `LoteProducto` llevan cantidades disponibles y fechas de vencimiento. Son usados por el consumo FIFO.
- `ConsumoInsumoVenta` deja trazabilidad del inventario usado por una venta.
- `CorrelativoDocumento` se consulta con bloqueo pesimista para evitar numeros duplicados en transacciones concurrentes.

### 4.8 DTO, validacion y mapeo

La carpeta `dto/` evita exponer entidades JPA directamente por HTTP.

| Subcarpeta o archivos | Uso |
|---|---|
| `dto/request/` | Requests de catalogo: categoria, cliente, proveedor, insumo, producto, receta, extra, combo, mesa, empleado, rol, configuracion, ajuste y metodo de pago. |
| `dto/` (raiz) | Requests de proceso: login, pedido, detalle de pedido, cambio/cancelacion de estado, compra/detalle, apertura/cierre de caja, movimiento, cobro, venta/pago/anulacion. |
| `dto/response/` | Responses por recurso y reportes: productos, pedidos, caja, venta, compra, inventario, seguridad, reportes y paginacion. |
| `dto/mapper/` | Mappers manuales de entidad a DTO y, cuando aplica, de request a entidad. Ejemplos: `ProductoMapper`, `PedidoMapper`, `VentaMapper`, `CajaMapper`, `CompraMapper`. |
| `dto/validation/` | Anotacion `ValidDocumentoIdentidad` y `DocumentoIdentidadValidator` para documento de cliente. |
| `dto/error/ApiErrorResponse.java` | Contrato uniforme de respuesta de error. |

Las clases `PagedResponse`, `StockInsuficienteDto`, `AlertaStockDto`, `UserSummaryDto` y `UploadResponse` son DTO especializados que complementan los recursos principales.

### 4.9 Base de datos y migraciones

| Migracion | Funcion |
|---|---|
| `V1__baseline_schema_final.sql` | Esquema destructivo inicial: tablas, relaciones, restricciones y estructuras base. |
| `V2__seed_minimo_seguridad.sql` | Datos minimos de seguridad: roles, permisos y usuario administrador inicial. |
| `V3__alinear_vistas_alerta_stock_vencimiento.sql` | Ajusta vistas usadas para alertas de stock y vencimiento. |
| `V4__crear_correlativo_documento.sql` | Crea la estructura para correlativos de comprobantes. |

Flyway valida migraciones al iniciar. No se deben editar migraciones ya aplicadas en otros ambientes; se agrega una migracion con version superior para todo cambio posterior.

### 4.10 Flujos de negocio backend

#### Compra e ingreso de inventario

```text
CompraRequest
  -> CompraService valida proveedor y lineas
  -> crea CompraInsumo + DetalleCompraInsumo
  -> crea LoteInsumo o LoteProducto
  -> actualiza costo promedio cuando aplica
  -> crea MovimientoInventario ENTRADA_COMPRA
  -> devuelve CompraResponse
```

Cada detalle debe referir a un insumo o a un SKU de inventario directo. La anulacion solo es valida si el lote originado no ha sido consumido; se revierte stock/costo y se registra el movimiento inverso.

#### Pedido, mesa y cocina

```text
Mesa disponible
  -> MesaService abre/recupera Pedido en BORRADOR_ATENCION
  -> PedidoService agrega DetallePedido y PedidoExtra
  -> PedidoService envia los preparados a CocinaService
  -> CocinaService produce comandas y actualiza detalle/pedido
  -> PrecuentaService emite cuenta previa
```

Los estados de pedido son controlados por politicas. Los productos preparados requieren cocina; los de inventario directo pueden quedar listos segun la regla de dominio implementada. Al abrir un pedido de mesa, la mesa deja de estar disponible.

#### Cobro y venta

```text
Pedido en CUENTA + caja abierta + pagos validos
  -> CajaService / VentaService validan importes y comprobante
  -> CorrelativoDocumentoService reserva numero
  -> se crea Venta, DetalleVenta y VentaPago
  -> LoteInsumoService/LoteProductoService descuentan FIFO
  -> se guardan ConsumoInsumoVenta y MovimientoInventario
  -> se registran movimientos de caja
  -> pedido se cierra y mesa se libera
```

Factura exige cliente con RUC valido. La anulacion de venta debe restaurar lotes/consumos y registrar contramovimientos de caja e inventario.

#### Ajuste de inventario

```text
AjusteInventarioRequest
  -> InventarioPolicy valida recurso y cantidad
  -> MovimientoInventarioService descuenta FIFO
  -> crea AjusteInventario y MovimientoInventario SALIDA_AJUSTE
```

El ajuste modelado es una salida manual. No debe permitir cantidades mayores al inventario disponible.

#### Autenticacion y cierre de sesion

```text
LoginRequest
  -> AuthenticationManager verifica password BCrypt
  -> AuthService cierra sesiones anteriores
  -> JwtTokenProvider genera JWT con jti
  -> TokenWhitelistService guarda hash en Redis
  -> AuthResponse devuelve token, empleado y permisos

Solicitud posterior
  -> JwtAuthenticationFilter valida JWT y hash Redis
  -> carga roles/permisos en SecurityContext
```

El logout elimina la autorizacion Redis y cierra la sesion registrada. Por ello, Redis es una dependencia real para aceptar tokens, no solo una cache opcional.

### 4.11 Pruebas backend

| Ubicacion | Cobertura |
|---|---|
| `src/test/java/com/restaurante/service/` | Unitarias para cliente, compra, lotes y venta. |
| `src/test/java/com/restaurante/service/policy/` | Transiciones de producto, pedido, cocina y venta. |
| `src/test/java/com/restaurante/controller/ReportesControllerTest.java` | Respuestas HTTP de reportes con MockMvc. |
| `src/test/java/com/restaurante/integration/SmokeApiIntegrationTest.java` | Recorrido de API con MariaDB/Redis reales: login, compras, FIFO, pedido, caja, venta, anulacion, correlativos y reportes. Solo corre con `RUN_MARIADB_INTEGRATION=true` y variables `TEST_DB_*`, `TEST_REDIS_*`, `TEST_JWT_SECRET`. |

## 5. Frontend: arquitectura y archivos

### 5.1 Tecnologias

- React 19 y TypeScript 6.
- Vite 8 para desarrollo y build.
- React Router para rutas de SPA.
- TanStack React Query para consultas, mutaciones e invalidacion de cache.
- Axios para HTTP.
- Zustand para estado global pequeno.
- Tailwind 4, Radix UI, componentes estilo shadcn y `next-themes`.
- Sonner para notificaciones, Recharts para graficas y Playwright/Vitest para pruebas.

La definicion de scripts y dependencias se encuentra en `frontend/package.json`.

### 5.2 Arbol funcional

```text
frontend/
  Dockerfile                         Build React y servidor Nginx
  nginx.conf                         SPA fallback y archivos estaticos
  package.json                       Scripts y dependencias Node
  vite.config.ts                     Plugins de React y Tailwind
  tsconfig*.json                     Configuracion TypeScript
  eslint.config.js                   Reglas de lint
  playwright.config.ts               Configuracion E2E
  index.html                         Documento base con #root
  public/                            Recursos publicos, actualmente favicon
  src/
    main.tsx                         Punto de montaje React
    app/                             App, rutas, paginas, componentes y contextos
    api/                             Axios, adaptadores REST y contrato generado
    config/                          Permisos y navegacion protegida
    hooks/                           React Query por dominio
    lib/                             Query client, utilidades y notificaciones
    store/                           Estado Zustand
    styles/                          Tailwind, tokens, fuentes y CSS global
    types/                           Declaraciones globales
  e2e/                               Flujos Playwright y auditorias HTTP
  scripts/                           Contratos OpenAPI, smoke y validacion visual
```

### 5.3 Arranque, proveedores y rutas

1. `src/main.tsx` monta React sobre el elemento `#root` de `index.html` e importa estilos globales.
2. `src/app/App.tsx` compone `QueryClientProvider`, `ThemeProvider`, `AuthProvider`, `RouterProvider` y `Toaster`.
3. `src/app/routes.tsx` crea el router del navegador. `src/app/lazyPages.tsx` permite cargar las paginas bajo demanda.
4. La ruta `/login` es publica. Cada ruta de negocio se envuelve con `ProtectedRoute`, `ERPProvider` y `Layout`.
5. `Layout.tsx` dibuja navegacion, cabecera, tema y contenido. `ProtectedRoute.tsx` redirige si no hay sesion valida o permiso UI suficiente.

| Ruta | Pagina | Funcion |
|---|---|---|
| `/` | `Dashboard.tsx` | Indicadores operativos iniciales. |
| `/login` | `Login.tsx` | Autenticacion mediante componentes `LoginForm` y `LoginBrand`. |
| `/mesas` | `Tables.tsx` | Configuracion/consulta de mesas. |
| `/pos` | `POS.tsx` | Punto de venta: pedido, cliente, carrito, extras y precuenta. |
| `/pedidos` | `Orders.tsx` | Tablero y gestion de pedidos. |
| `/cocina` | `Kitchen.tsx` | Comandas y estados de preparacion. |
| `/caja` | `CashRegister.tsx` | Apertura, cierre, movimientos y cobro. |
| `/categorias`, `/productos`, `/combos`, `/extras`, `/recetas` | `Categories`, `Products`, `Combos`, `ProductExtras`, `RecipeBuilder` | Catalogo de venta y produccion. |
| `/insumos`, `/kardex`, `/inventario` | `Supplies`, `Kardex`, `DirectInventory` | Insumos, trazabilidad y ajustes. |
| `/proveedores`, `/compras` | `Suppliers`, `Purchases` | Abastecimiento y lotes. |
| `/dashboard-gerencial`, `/reportes` | `ExecutiveDashboard`, `Reports` | Analitica y reportes. |
| `/clientes`, `/ventas` | `Customers`, `Sales` | Clientes, comprobantes y anulaciones. |
| `/empleados`, `/roles`, `/metodos-pago` | `Employees`, `Roles`, `PaymentMethods` | Administracion de usuarios, roles y cobros. |
| `/configuracion`, `/auditoria`, `/seguridad`, `/perfil` | `CompanySettings`, `Audit`, `Security`, `Profile` | Parametros, trazabilidad, sesiones y perfil. |

No se observa una ruta comodin 404 ni `errorElement` global del router. Una URL no contemplada requiere revisar el comportamiento de React Router en ejecucion.

### 5.4 Autenticacion, permisos y estado

| Archivo | Responsabilidad |
|---|---|
| `api/auth.ts` | Crea el cliente Axios, toma `VITE_API_URL` o usa fallback localhost, agrega Bearer token y trata respuestas 401. |
| `hooks/useAuth.ts` | Ejecuta login y normaliza la respuesta para el estado de sesion. |
| `app/contexts/AuthContext.tsx` | Recupera `/auth/me` al montar si existe token, expone usuario/login/logout y coordina el store. |
| `app/contexts/AuthContextValue.ts` | Tipo del contrato del contexto de autenticacion. |
| `store/authStore.ts` | Usuario, permisos, carga y error en memoria. Solo el token se persiste en `localStorage`. |
| `config/permissions.ts` | Catalogo de permisos conocido por la interfaz. |
| `config/protectedNavigation.ts` | Entradas del menu, permisos requeridos y reglas de visibilidad. Trata varias alternativas como OR y permite `ACCESO_TOTAL`. |
| `app/components/ProtectedRoute.tsx` | Bloquea o redirige rutas en el cliente. |

Ante 401, el cliente limpia token, invalida/cancela cache React Query y redirige al login. La validacion definitiva de permiso debe permanecer en Spring Security y `@PreAuthorize` del backend.

### 5.5 Contexto ERP y capa de datos

`app/contexts/ERPContext.tsx` es una fachada de aplicacion para pantallas de operacion. Integra productos, clientes, pedidos, caja, carrito, extras y operaciones frecuentes del POS. `ERPContextValue.ts` tipa lo que el proveedor ofrece y `cart-utils.ts` concentra funciones auxiliares del carrito.

El contexto:

- Mapea DTO de API a modelos usados por UI.
- Mantiene el carrito en memoria de la pagina/sesion.
- Valida precio y stock visibles antes de agregar lineas.
- Consulta extras y detalle de producto para variantes/stock.
- Crea clientes rapidos, pedidos, cambios de estado, precuentas y operaciones de caja.
- Activa polling de pedidos cada cinco segundos en vistas de Cocina y Pedidos.

El backend sigue siendo la fuente de verdad: recargar la pagina puede perder el carrito no persistido, pero no debe perder un pedido ya guardado en API.

### 5.6 Adaptadores API y hooks

Cada archivo de `src/api/` encapsula rutas HTTP y tipos locales de un dominio. Cada archivo `src/hooks/useX.ts` consume el adaptador equivalente con React Query, define query keys/mutaciones e invalida recursos relacionados.

| Dominio | Adaptador API | Hook(s) | Consumidores principales |
|---|---|---|---|
| Sesion | `auth.ts` | `useAuth.ts` | Login, AuthContext, rutas protegidas. |
| Catalogo | `categorias.ts`, `productos.ts`, `extras.ts`, `combos.ts` | `useCategorias`, `useProductos`, `useExtras`, `useCombos` | Productos, POS, recetas, combos. |
| Clientes y proveedores | `clientes.ts`, `proveedores.ts` | `useClientes`, `useProveedores` | Clientes, POS, Compras. |
| Insumos e inventario | `insumos.ts`, `movimientos.ts` | `useInsumos`, `useMovimientos` | Insumos, Kardex, Inventario, Compras. |
| Compras | `compras.ts` | `useCompras` | Wizard de compras. |
| Salon y pedidos | `mesas.ts`, `pedidos.ts`, `cocina.ts`, `precuentas.ts` | `usePedidos` y operaciones del ERPContext | Mesas, POS, Pedidos, Cocina, Caja. |
| Caja y ventas | `cajas.ts`, `ventas.ts`, `metodoPagos.ts` | `useCaja`, `useVentas`, `useMetodoPagos` | Caja, Ventas, POS. |
| Personal y permisos | `empleados.ts`, `roles.ts`, `permisos.ts` | `useEmpleados`, `useRoles`, `usePermisos` | Empleados, Roles, navegacion. |
| Configuracion y control | `configuracion.ts`, `auditoria.ts`, `seguridad.ts` | `useConfiguracion`, `useAuditoria`, `useSeguridad` | Configuracion, Auditoria, Seguridad. |
| Reportes | `reportes.ts` | `useReportes` | Dashboard, panel gerencial y reportes. |

`api/generated/openapi-types.ts` es especial: es codigo generado desde `/v3/api-docs` o el baseline `backend/openapi-baseline.json`. No debe editarse a mano. Los adaptadores pueden refinar esos tipos para necesidades de UI, pero deben volver a generarse tras cambios de backend.

`hooks/usePrivateQuery.ts` evita consultas cuando no hay token/sesion. `lib/queryClient.ts` define un reintento y desactiva refetch al recuperar foco; la cache usual es de 30 segundos y la de reportes llega a cinco minutos.

### 5.7 Paginas funcionales

| Archivo | Funcion principal | Relaciones |
|---|---|---|
| `Dashboard.tsx` | Resumen de operacion. | Consume reportes y datos de pedidos/caja. |
| `Tables.tsx` | Mantenimiento y estado de mesas. | `mesas.ts`, `pedidos.ts`, POS. |
| `POS.tsx` | Armado de pedido y precuenta. | ERPContext, productos, clientes, pedidos, extras, caja. |
| `Orders.tsx` | Lista/tablero de pedidos. | Pedidos, precuentas, cocina y polling. |
| `Kitchen.tsx` | Produccion de comandas. | `cocina.ts`, pedidos, polling. |
| `CashRegister.tsx` | Ciclo de caja y cobro. | Caja, pedidos, ventas, metodos de pago. |
| `Categories.tsx` | Mantenimiento de categorias. | `categorias.ts`. |
| `Products.tsx` | Padres, SKU, precio, stock y estado. | Productos, categorias, lotes y extras. |
| `Combos.tsx` | Alta/edicion de combos. | Combos y productos. |
| `ProductExtras.tsx` | Alta/edicion de extras. | Extras y productos. |
| `RecipeBuilder.tsx` | Recetas de productos preparados. | Productos e insumos. |
| `Supplies.tsx` | Catalogo de insumos. | Insumos, compras e inventario. |
| `Kardex.tsx` | Consulta de movimientos. | `movimientos.ts`, lotes y compras/ventas. |
| `DirectInventory.tsx` | Ajustes manuales. | Inventario, productos e insumos. |
| `Suppliers.tsx` | Gestion de proveedores. | `proveedores.ts`, compras. |
| `Purchases.tsx` | Wizard de compra y lotes. | Proveedores, insumos, productos, compras y cache. |
| `ExecutiveDashboard.tsx` | KPIs gerenciales y graficas. | Reportes. |
| `Reports.tsx` | Informes filtrables. | Reportes y exportacion/visualizacion. |
| `Customers.tsx` | Gestion de clientes y documentos. | `clientes.ts`, POS, ventas. |
| `Sales.tsx` | Consulta y anulacion de ventas. | `ventas.ts`, caja e inventario. |
| `Employees.tsx` | Personal, avatar y actividad. | Empleados, roles, uploads. |
| `Roles.tsx` | Roles y permisos. | Roles, permisos y empleados. |
| `PaymentMethods.tsx` | Medios de pago. | Metodos de pago y caja. |
| `CompanySettings.tsx` | Datos de empresa y marca. | Configuracion y `configStore`. |
| `Audit.tsx` | Trazabilidad de operaciones. | Auditoria. |
| `Security.tsx` | Sesiones y alertas. | Seguridad. |
| `Profile.tsx` | Perfil del usuario actual. | AuthContext/empleados. |
| `Login.tsx` | Pantalla publica de acceso. | `LoginForm`, `LoginBrand`, `useAuth`. |

### 5.8 Componentes, estilos y recursos

| Ubicacion | Funcion |
|---|---|
| `app/components/Layout.tsx` | Shell comun: navegacion, responsive, tema y contenido protegido. |
| `app/components/auth/LoginForm.tsx` | Formulario de credenciales y envio de login. |
| `app/components/auth/LoginBrand.tsx` | Identidad visual de la pantalla de acceso. |
| `app/components/ui/` | Primitivas reutilizables: `button`, `input`, `table`, `dialog`, `select`, `tabs`, `checkbox`, `switch`, `textarea`, `badge`, `card`, `avatar`, `dropdown-menu`, `scroll-area`, `progress`, `radio-group`, `separator`, `sonner`, `image-upload-zone`, `erp-layout` y utilidades/variantes. Son wrappers de Radix/shadcn y evitan duplicar accesibilidad/estilos basicos. |
| `styles/tailwind.css` | Entrada de Tailwind. |
| `styles/theme.css` | Tokens semanticos, claro/oscuro, sombras, estados y reglas responsive. |
| `styles/index.css` | Estilos globales aplicados al montaje. |
| `styles/fonts.css` | Punto reservado para tipografias; actualmente es un placeholder. |
| `types/global.d.ts` | Declaraciones TypeScript globales. |
| `public/favicon.svg` | Icono estatico del navegador. |

`store/configStore.ts` contiene nombre/logo visibles; se hidrata al consultar configuracion. `store/notificationStore.ts` conserva hasta 50 notificaciones locales y `lib/notifications.ts` las alimenta. Esto es estado de interfaz, no auditoria del backend.

### 5.9 Pruebas y automatizaciones frontend

| Archivo/comando | Funcion |
|---|---|
| `src/app/pages/POS.test.ts` y `npm test` | Pruebas Vitest visibles, concentradas en POS. |
| `e2e/audit.spec.ts` | Playwright contra API para producto, compra, POS, caja/cobro y kardex; registra artefactos de endpoints. |
| `e2e/pos-pricing.spec.ts` | Escenario aislado de precios del POS con API simulada. |
| `e2e/auth.setup.ts`, `e2e/support/*`, `e2e/fixtures/*`, `e2e/reporters/*` | Autenticacion, datos, auditoria y reporte compartido de E2E. |
| `scripts/smoke-rf-check.mjs` y `npm run test:smoke` | Checklist estatico de patrones de frontend/backend; no es una prueba de ejecucion. |
| `scripts/visual-validate.mjs` y `npm run visual:validate` | Captura rutas en desktop/movil, normalmente con autenticacion mock; no compara snapshots de diseno. |
| `scripts/generate-openapi-types.mjs` | Genera/verifica `openapi-types.ts` desde backend activo o baseline. |
| `npm run contracts:generate` / `contracts:check` | Sincroniza y detecta tipos OpenAPI generados desactualizados. |

## 6. Interrelacion entre frontend y backend

### 6.1 Contrato HTTP y tipos

```text
Controller + DTO backend
  -> springdoc publica /v3/api-docs
  -> scripts/generate-openapi-types.mjs obtiene el documento
  -> api/generated/openapi-types.ts
  -> api/<dominio>.ts ajusta el contrato para UI
  -> hooks/use<Domino>.ts crea queries/mutations
  -> pagina o ERPContext renderiza y ejecuta acciones
```

La actualizacion correcta tras cambiar un endpoint o DTO es:

```powershell
cd frontend
npm run contracts:generate
npm run contracts:check
npm run lint
npm run build
```

Si el backend no esta disponible, el generador usa `backend/openapi-baseline.json`. El baseline debe actualizarse desde un `/v3/api-docs` valido, nunca desde una respuesta HTML o vacia.

### 6.2 Flujo POS completo

```text
POS.tsx / ERPContext
  -> GET productos, clientes, mesas, extras y pedido activo
  -> POST pedido o POST pedido/mesa
  -> POST detalle y extras
  -> POST enviar a cocina
  -> Kitchen.tsx actualiza comandas/detalles
  -> POST precuenta
  -> CashRegister.tsx abre caja y cobra
  -> backend crea venta, descuenta stock, cierra pedido y libera mesa
  -> React Query invalida pedidos, stock, caja, ventas, reportes y mesas
```

### 6.3 Flujo de inventario completo

```text
Purchases.tsx
  -> POST /compras
  -> CompraService crea lotes + kardex
  -> useCompras invalida productos/insumos/movimientos/reportes
  -> Supplies, Products y Kardex vuelven a consultar

CashRegister/Sales
  -> cobro/anulacion de venta
  -> VentaService consume/restaura lotes FIFO + kardex
  -> hooks invalidan stock, movimientos, ventas y reportes
```

### 6.4 Archivos y URLs de imagen

`image-upload-zone.tsx` llama a los endpoints de `UploadController`. El backend guarda el archivo en `uploads/`, genera una URL bajo `/api/uploads/**` y Nginx no es el responsable de esos archivos. Las pantallas que construyan URLs completas deben derivar el origen de `VITE_API_URL`; evitar valores fijos de `localhost` para que funcionen fuera de desarrollo.

## 7. Fuente de verdad y documentacion existente

El orden recomendado al resolver dudas de comportamiento es:

1. Controlador, servicio, politica, entidad y DTO actuales del backend.
2. Contrato vivo `/v3/api-docs` o `backend/openapi-baseline.json` actualizado.
3. Tipos generados `frontend/src/api/generated/openapi-types.ts`.
4. Adaptador API, hook y pagina frontend.
5. Pruebas automatizadas vigentes.
6. Planes en `docs/` y scripts historicos.

`PLAN.md` y `FRONTEND_PLAN.md` son valiosos como hoja de ruta, pero contienen fases, pendientes y nombres de campos de distintos momentos del proyecto. Deben validarse contra codigo/OpenAPI antes de convertirlos en cambios. El mismo criterio aplica a `scripts/validate-fase12-acceptance.mjs`, que incluye payloads de aceptacion que pueden haber quedado desalineados de contratos posteriores.

## 8. Riesgos y deuda tecnica identificada

Los siguientes puntos proceden de inspeccion estatica y deben confirmarse con pruebas de integracion antes de considerarlos cerrados.

### 8.1 Criticos

| Riesgo | Evidencia | Impacto | Accion recomendada |
|---|---|---|---|
| Autorizacion granular incompleta en backend | Varias rutas administrativas no tienen `@PreAuthorize` explicito, incluyendo areas como empleados, roles, seguridad, configuracion, auditoria, catalogos, inventario y uploads. | Un usuario autenticado podria ejecutar acciones que la navegacion frontend le oculta. | Definir una matriz endpoint-permiso y proteger cada controlador/metodo en Spring Security. Probar con usuarios de rol minimo. |
| SSRF en importacion por URL | `UploadService` acepta URL remota para descargar archivo sin una lista visible de hosts/protocolos, limite de descarga o timeout robusto. | Puede permitir acceso a servicios internos o consumir recursos. | Permitir solo `https`/`http`, bloquear IP privadas/metadata, fijar timeout/tamano, validar contenido real y registrar intentos. |
| Venta directa/pago potencialmente duplicable | El flujo `registrarVenta` y `pagarVenta` debe revisarse para asegurar una sola aplicacion de pagos, stock y caja. | Cobros/consumos duplicados o venta inconsistente. | Unificar maquina de estados de venta, hacer idempotente el cobro y cubrirla con pruebas transaccionales/concurrentes. |
| Concurrencia de lotes | Los consumos FIFO necesitan bloqueo o versionado consistente para impedir sobreconsumo simultaneo. | Stock negativo o perdida de actualizaciones. | Usar bloqueo pesimista o `@Version` en lotes y probar dos cobros concurrentes. |

### 8.2 Altos

| Riesgo | Evidencia | Accion recomendada |
|---|---|---|
| Control de caja insuficiente | La seleccion/cierre de caja debe validar propietario y registrar claramente quien cierra. | Restringir caja activa al empleado autorizado, validar cierre y auditar responsable. |
| Auditoria con datos sensibles | La serializacion por aspecto puede incluir hash de password o token; auditoria es informacion sensible. | Excluir/mascarar campos secretos, restringir endpoint de auditoria y definir retencion. |
| Credenciales iniciales conocidas | El seed de seguridad contiene credenciales iniciales previsibles usadas por pruebas. | Forzar cambio de password, no desplegar seed de desarrollo en produccion y rotar credenciales. |
| Rentabilidad posiblemente duplicada | Una consulta que une venta con detalles debe evitar sumar `venta.total` por cada linea. | Revisar agregacion SQL y agregar caso de venta con multiples detalles. |
| Costeo de SKU directo | Se debe basar en lotes FIFO consumidos, no en un porcentaje fijo del precio de venta. | Guardar costo real por consumo y usarlo en margen/kardex. |

### 8.3 Medios

| Riesgo | Evidencia | Accion recomendada |
|---|---|---|
| JWT en `localStorage` | El token persiste en el navegador. | Reducir superficie XSS, endurecer CSP y evaluar cookie HttpOnly/refresh token segun arquitectura. |
| Sin 404/error boundary | Router no define ruta comodin ni error global. | Agregar pagina 404 y limite de errores para rutas/cargas fallidas. |
| Configuracion API en despliegue | Nginx frontend sirve SPA pero no proxifica API; el build necesita una base API accesible desde navegador. | Definir `VITE_API_URL` para cada ambiente o agregar proxy Nginx. |
| Posible N+1 en ERPContext | Se consulta detalle por producto para calcular variantes/stock. | Exponer resumen suficiente desde API o agrupar solicitudes. |
| Carrito no persistente | Estado transitorio se pierde al recargar/navegar fuera de POS. | Derivarlo del pedido guardado o persistirlo por mesa con el backend como fuente de verdad. |
| Listados sin paginacion | Auditoria, sesiones, inventario y otros listados pueden crecer sin limites. | Implementar paginacion y filtros de servidor. |
| Manejo de errores inconsistente | Algunos controladores responden `IllegalArgumentException` directamente y Auth puede exponer mensajes internos. | Centralizar respuestas y no filtrar detalles de infraestructura. |
| Configuracion visual tardia | Nombre/logo se cargan principalmente al visitar Configuracion. | Hidratar configuracion global al iniciar Layout/App. |

## 9. Plan de mantenimiento del sistema

### 9.1 Contexto y criterio de clasificacion

Este sistema es software, no maquinaria industrial. Sin embargo, los cuatro tipos solicitados se pueden aplicar al ciclo de vida de sus componentes: interfaz React, API Spring Boot, base de datos MariaDB, cache Redis, contenedores, red y datos operativos.

La clasificacion usada en este informe es la siguiente:

| Tipo | Aplicacion al sistema Restaurante |
|---|---|
| Correctivo | Se aplica despues de detectar un fallo funcional, error de datos, problema visual o inconsistencia en un flujo. Corrige la causa para restaurar el comportamiento esperado. |
| Preventivo | Introduce validaciones, pruebas, restricciones o tareas programadas para evitar que una falla conocida ocurra o reaparezca. |
| Predictivo | Usa metricas, tendencias y umbrales medidos mientras el sistema opera para anticipar un fallo antes de que afecte al usuario. |
| Proactivo | Elimina causas raiz y riesgos antes de que se manifiesten como incidentes. Incluye endurecimiento de seguridad, diseno transaccional, revisiones de arquitectura y automatizacion de controles. |

La evidencia de cambios historicos demuestra uso de mantenimiento correctivo, preventivo y parcialmente proactivo. No existe evidencia de un sistema predictivo completo: faltan telemetria historica, dashboards, tendencias y alertas operacionales. Por tanto, el mantenimiento predictivo se presenta como una capacidad a implementar, no como una funcion ya disponible.

### 9.2 Mantenimiento correctivo aplicado

Los siguientes casos estan respaldados por el historial Git, el codigo y/o las pruebas del repositorio. Son correctivos porque responden a un defecto, una inconsistencia o un comportamiento incorrecto ya identificado.

| Caso corregido | Cambio realizado y motivo | Funcion relacional afectada | Evidencia |
|---|---|---|---|
| Stock, lotes FIFO y alertas | Se alinearon las vistas de stock y vencimiento; los lotes vencidos, agotados o anulados no deben contarse como disponibles. Al devolver inventario se preservan estados de lote. | `Compra -> Lote -> MovimientoInventario -> Reporte`; tambien afecta `Venta -> consumo FIFO -> stock`. Evita vender, reportar o alertar cantidades que no son utilizables. | Commit `29b22b4`; `backend/src/main/resources/db/migration/V3__alinear_vistas_alerta_stock_vencimiento.sql`; `LoteInsumoService.java`. |
| Numeracion de comprobantes | El numero de venta paso de ser un valor controlable por cliente a generarse de forma atomica en backend, con unicidad y bloqueo pesimista. | `Caja/Pedido -> Venta -> CorrelativoDocumento -> MariaDB`. Impide dos comprobantes con el mismo numero durante cobros simultaneos. | Commit `9aa4a4b`; `V4__crear_correlativo_documento.sql`; `CorrelativoDocumentoRepository.java`; `VentaServiceTest.java`. |
| Precio nulo en POS | Productos, SKU o extras sin precio ya no se pueden ingresar al carrito ni totalizar implicitamente a cero. | `Products/Extras -> ERPContext/POS -> Pedido -> Venta`. Evita pedidos y cobros por importes incorrectos. | Commit `72ce03e`; `frontend/src/app/pages/pos-utils.ts`; `frontend/e2e/pos-pricing.spec.ts`. |
| Cliente sin documento | Se corrigio la validacion para permitir `SIN_DOCUMENTO` sin exigir numero; los otros tipos siguen validando su valor. El frontend se ajusto al contrato. | `Customers/POS -> ClienteRequest -> DocumentoIdentidadValidator -> Pedido/Venta`. Evita rechazar clientes validos y evita convertir documentos incorrectamente. | Commits `cb79e31` y `0eb126a`; `DocumentoIdentidadValidator.java`; `ClienteRequestValidationTest.java`; `Customers.tsx`. |
| Cache desactualizada tras compras | Crear o anular compras invalida compras, insumos, productos, movimientos y reportes; tambien se unificaron claves de metodos de pago. | `Purchases -> API -> React Query -> Supplies/Products/Kardex/Reports`; `PaymentMethods -> CashRegister`. Evita que una pantalla muestre stock, kardex o metodos de pago antiguos. | Commit `e189fa3`; `frontend/src/hooks/useCompras.ts`; `useMetodoPagos.ts`. |
| Contratos API y pantalla | Se alinearon DTO de movimientos, contratos menores y tipos generados OpenAPI para reducir diferencias entre API y frontend. | `Controller/DTO -> OpenAPI -> api/generated -> Adaptador API -> Pagina`. Evita campos/enums obsoletos y errores de integracion. | Commits `e9f7987`, `9211d22` y `d7d29f4`; `frontend/src/api/movimientos.ts`; `openapi-types.ts`. |
| Desborde del modal de compras | Se corrigieron dimensiones, scroll, textos largos y visualizacion movil del modal de compras. | `Purchases.tsx -> CompraRequest -> CompraService`. Evita que el operador no pueda revisar/agregar lineas en pantallas reducidas. | Commit `d496986`; `frontend/src/app/pages/Purchases.tsx`. |

Estos correctivos siguen una cadena comun: se detecta un defecto en una funcion, se identifica el modulo responsable, se corrige la regla o presentacion, y se agrega o actualiza una prueba para evitar la repeticion. Un cambio en una capa no debe considerarse completo si deja desalineadas las capas relacionadas.

```text
Pantalla o prueba detecta falla
  -> se revisa contrato y servicio backend
  -> se ajusta frontend, backend o migracion
  -> se actualizan tipos OpenAPI y cache si aplica
  -> se valida la transaccion completa
```

### 9.3 Mantenimiento preventivo aplicado y recomendado

El sistema ya contiene mecanismos preventivos. No esperan a que el usuario reporte el error: reducen la posibilidad de que aparezca una falla o una regresion.

| Mecanismo preventivo | Como funciona | Componentes relacionados | Beneficio |
|---|---|---|---|
| Migraciones Flyway y validacion JPA | Flyway versiona el esquema y Hibernate usa `ddl-auto=validate`. La aplicacion falla al iniciar si entidades y BD no son compatibles. | `application.properties`, `db/migration/`, entidades JPA, MariaDB. | Previene deriva de esquema y cambios manuales no controlados. |
| Correlativo con restriccion y bloqueo | La BD protege la unicidad de serie/numero y el repositorio bloquea el correlativo durante el cobro. | Venta, Caja, Pedido, `CorrelativoDocumento`, MariaDB. | Previene duplicacion de comprobantes ante concurrencia. |
| Pruebas unitarias y de politicas | Prueban validaciones de cliente, compra, lotes, venta y transiciones de pedido/cocina. | `src/test/java/com/restaurante/service/` y `service/policy/`. | Previenen regresiones de reglas de negocio antes de desplegar. |
| Prueba de integracion opcional | Recorre login, Redis/JWT, compras, FIFO, pedidos, caja, ventas, anulacion y reportes con MariaDB/Redis reales. | `SmokeApiIntegrationTest.java`. | Previene fallos de integracion entre servicios que una prueba unitaria no detecta. |
| Contratos OpenAPI generados | El frontend genera tipos desde el contrato backend y puede verificar que no esten desactualizados. | `/v3/api-docs`, `openapi-baseline.json`, `generate-openapi-types.mjs`. | Previene incompatibilidades de DTO, enums, rutas y campos entre frontend/backend. |
| E2E, smoke y validacion visual | Playwright audita flujos de producto, compra, POS, caja/cobro y kardex; los scripts revisan patrones y rutas visuales. | `frontend/e2e/`, `frontend/scripts/`. | Previene regresiones de experiencia y de flujos completos. |
| Healthchecks de dependencias | Docker espera que MariaDB y Redis respondan antes de iniciar backend. | `docker-compose.yml`, MariaDB, Redis, backend. | Previene arranques iniciales contra dependencias aun no disponibles. |
| Validaciones de DTO y politicas | Requests usan Bean Validation y servicios usan politicas para estado, inventario, cocina, productos, caja y ventas. | `dto/`, `service/policy/`, servicios transaccionales. | Previene datos invalidos y transiciones no permitidas. |

**Rutina preventiva propuesta:** ejecutar `mvn test`, `npm run contracts:check`, `npm run lint`, `npm test`, `npm run build` y los E2E en staging antes de cada entrega. Semanalmente se deben revisar las migraciones aplicadas, backups, usuarios/roles, alertas de seguridad, espacio en disco y resultados de las pruebas de integracion.

### 9.4 Mantenimiento predictivo: capacidad por implementar

El mantenimiento predictivo requiere observar tendencias reales. Actualmente el proyecto tiene endpoints de salud, logs de solicitudes, auditoria y pruebas; eso permite diagnostico basico, pero no constituye prediccion. No se encontraron Actuator, Micrometer, Prometheus, Grafana, OpenTelemetry, Sentry, alertas automatizadas ni series temporales de metricas.

Para aplicar mantenimiento predictivo se debe recolectar informacion durante la operacion y actuar antes del fallo:

| Elemento a anticipar | Senal a medir | Prediccion/accion posible | Modulos relacionados |
|---|---|---|---|
| Saturacion de backend | p95/p99 de API, tasa 5xx, heap JVM, GC, threads y pool JDBC. | Si el p95 crece sostenidamente o el pool supera 80%, revisar consultas, N+1, capacidad o reiniciar de forma controlada antes de indisponibilidad. | React/Axios -> Nginx -> Spring Boot -> MariaDB/Redis. |
| Agotamiento de disco | Uso y crecimiento del volumen MariaDB, Redis y `uploads/`. | Si la tendencia proyecta 85% antes de una semana, ampliar/limpiar almacenamiento y validar backups. | Docker, MariaDB, Redis, UploadService. |
| Problemas de Redis/JWT | Latencia Redis, evictions, memoria, errores de conexion y tasa de 401 inesperados. | Si aparecen evictions o aumenta la latencia, ampliar memoria/revisar TTL antes de bloquear sesiones activas. | AuthService, JwtAuthenticationFilter, TokenWhitelistService, Redis. |
| Lentitud de base de datos | Slow queries, conexiones, locks, duracion de transacciones y errores SQL. | Detectar consultas que empeoran tras crecer catalogo/ventas e indexar/optimizar antes de afectar POS y caja. | Repositories, servicios, MariaDB, reportes. |
| Cola de cocina | Tiempo pedido->cocina->listo, edad de comandas y pedidos pendientes. | Si la tendencia supera el tiempo objetivo, redistribuir personal o revisar cuellos de botella antes de incumplir atencion. | PedidoService, CocinaService, Kitchen.tsx. |
| Inventario critico | Velocidad de consumo por insumo/SKU, lote proximo a vencer y stock disponible. | Predecir fecha de agotamiento/vencimiento y planificar compra antes de bloquear ventas. | Compra, lotes, venta FIFO, ReporteService, Purchases.tsx. |
| Fallos de UX | Errores JS por release, LCP/INP/CLS y abandono/error de pasos POS/cobro. | Revertir una release o corregir pantalla antes de que el fallo afecte a todos los operadores. | React, POS, CashRegister, Sentry/Web Vitals. |

La implementacion recomendada es Actuator + Micrometer en backend, Prometheus para recolectar series, Grafana para tendencias y Alertmanager para avisos. En frontend, Sentry con sourcemaps y Web Vitals debe registrar errores de navegador y rendimiento por version. Las predicciones deben basarse en varias mediciones historicas, no en un valor aislado.

### 9.5 Mantenimiento proactivo aplicado y recomendado

El mantenimiento proactivo trabaja sobre riesgos antes de que sean incidentes. No sustituye al correctivo: reduce la probabilidad e impacto de futuros correctivos.

| Accion proactiva | Estado | Justificacion y relacion |
|---|---|---|
| Revocacion de JWT con Redis | Implementado. | Un token con firma valida solo es aceptado si coincide con el hash vigente del empleado. Permite cerrar sesiones y reduce el impacto de tokens antiguos/robados. Archivos: `JwtAuthenticationFilter.java`, `TokenWhitelistService.java`, `AuthService.java`. |
| Correlation ID y logging HTTP | Implementado parcialmente. | `CorrelationIdFilter` genera/devuelve `X-Correlation-ID` y `RequestLoggingFilter` registra solicitudes, status y duracion. Debe incluirse el ID en logs estructurados y propagarse desde Axios para ser plenamente operativo. |
| Auditoria de cambios | Implementado parcialmente. | `AuditoriaAspect` registra altas/cambios/borrados para investigar operaciones. Debe excluir hashes, tokens y otros campos sensibles; tambien debe restringirse su consulta por permiso. |
| Autorizacion granular de servidor | Pendiente prioritario. | Ocultar rutas en frontend no protege endpoints. Se deben definir permisos por controlador/operacion y probar roles de menor privilegio. Afecta empleados, roles, seguridad, auditoria, configuracion, inventario y uploads. |
| Endurecimiento de carga por URL | Pendiente prioritario. | `UploadService` debe restringir protocolos, hosts/IP privados, tamano, tiempo y tipo real de archivo para evitar SSRF y consumo abusivo. |
| Concurrencia de inventario | Pendiente prioritario. | Lotes FIFO necesitan bloqueo o versionado consistente para evitar sobreconsumo con dos cobros/ajustes simultaneos. Debe cubrirse con prueba MariaDB concurrente. |
| Credenciales y secretos | Pendiente prioritario. | El usuario seed de desarrollo no debe conservar credenciales conocidas en produccion. Secretos deben venir solo de variables/gestor de secretos y rotarse. |
| Recuperacion y continuidad | Pendiente. | Definir backup probado de MariaDB/Redis/uploads, restauracion documentada, retencion de logs y procedimiento de contingencia para caja/POS. |

### 9.6 Matriz de impacto relacional ante cambios

La siguiente matriz sirve para evaluar que revisar cuando se modifica una funcion. Reduce el riesgo de corregir una pantalla pero dejar inconsistente el flujo completo.

| Cambio en la funcion | Revisar tambien | Mantenimiento aplicable | Motivo |
|---|---|---|---|
| Precio, SKU, extra o combo | Producto, pedido, carrito, precuenta, venta, reportes, tipos OpenAPI y pruebas POS. | Correctivo/preventivo. | Un precio invalido llega desde catalogo hasta cobro y utilidad. |
| Lote, stock, vencimiento o FIFO | Compra, ajuste, venta, anulacion, kardex, alertas y reportes. | Correctivo, preventivo, predictivo. | El inventario es compartido por compras y ventas; un cambio afecta disponibilidad y costos. |
| Estado de pedido o cocina | Mesa, detalle, comanda, precuenta, caja, polling e interfaz POS. | Correctivo/preventivo. | Los estados deben transitar de forma identica en backend y frontend. |
| Cobro, pago o comprobante | Caja, correlativo, detalle venta, lotes, movimiento de caja, kardex, pedido y mesa. | Correctivo, preventivo, proactivo. | Es una transaccion critica que debe ser atomica e idempotente. |
| Login, rol o permiso | JWT, Redis, endpoints, menu, rutas protegidas, sesiones, auditoria y alertas. | Correctivo, preventivo, proactivo. | El frontend mejora UX, pero el backend debe garantizar autorizacion real. |
| DTO, endpoint o enum | Controller, servicio, OpenAPI, tipo generado, adaptador API, hook, cache, pagina y pruebas. | Correctivo/preventivo. | Evita deriva contractual y errores de integracion. |
| Despliegue, BD, Redis o red | Compose, variables, health/readiness, logs, backups, frontend API URL y alertas. | Preventivo, predictivo, proactivo. | La disponibilidad depende de todas las capas, no solo del codigo. |

## 10. Plan de monitoreo

### 10.1 Estado actual de observabilidad

La observabilidad actual es basica y local. Existen señales utiles, pero no estan centralizadas ni generan alertas automaticas.

| Tipo de senal actual | Implementacion | Limite actual |
|---|---|---|
| Salud de backend | `GET /api/v1/health`, `/health/db` y `/health/cache` en `HealthController.java`. | La salud general no comprueba dependencias y `/health/cache` no verifica Redis de forma efectiva, aunque Redis es obligatorio para JWT. |
| Salud de contenedores | Healthchecks de MariaDB (`mariadb-admin ping`) y Redis (`redis-cli ping`) cada 5 s; backend espera ambos al iniciar. | No hay healthcheck de backend ni frontend; tampoco alerta externa ni reinicio dirigido por estado unhealthy. |
| Logs de solicitud | `RequestLoggingFilter.java` registra metodo, ruta, status y duracion. | No hay logs JSON, centralizacion, busqueda, retencion ni dashboard de errores/latencia. |
| Correlacion | `CorrelationIdFilter.java` maneja `X-Correlation-ID` y MDC. | El formato de log no evidencia que imprima el ID y Axios no lo propaga de forma controlada. |
| Auditoria y seguridad | Auditoria de cambios, alertas de login fallido, sesiones multiples y sesiones largas. | Son datos consultados bajo demanda; no hay correo, chat, pager ni escalamiento automatico. |
| E2E y visual | Playwright audita HTTP/errores JS y `visual:validate` toma capturas de rutas. | No se ejecutan continuamente, no miden Web Vitals ni representan monitoreo de produccion. |
| Reportes de negocio | Reportes de stock, ventas, compras, utilidad y productos populares. | Son consultas bajo demanda, no metricas series temporales ni alertas. |

Un artefacto E2E historico versionado reporta errores 500 en `GET /api/v1/productos/:id`, un error de render POS y un timeout de cobro. Esta evidencia se encuentra en `frontend/e2e/artifacts/playwright-audit/`; no fue ejecutada de nuevo durante este informe y no debe interpretarse como estado actual sin reproducirla. Si se confirma, debe tratarse como mantenimiento correctivo P0.

### 10.2 Monitoreo de rendimiento de aplicaciones (APM)

| Aspecto | Plan propuesto |
|---|---|
| Objetivo | Conocer disponibilidad y rendimiento interno de Spring Boot antes de que POS, cocina o caja perciban lentitud/fallos. |
| Implementacion | Agregar Spring Boot Actuator y Micrometer Prometheus; recolectar con Prometheus, visualizar en Grafana y alertar con Alertmanager. OpenTelemetry + Tempo/Jaeger se agrega si se requiere trazabilidad distribuida. |
| Metricas | RPS, p50/p95/p99 por ruta, 4xx/5xx, JVM heap, GC, threads, pool JDBC, latencia/errores de MariaDB y Redis, duracion de transacciones y bloqueos. |
| Flujos criticos | `/auth/login`, productos para POS, crear/enviar pedido, cocina, abrir/cerrar caja, cobrar pedido, registrar venta, compras y kardex. |
| Umbrales iniciales | Error 5xx >1% por 5 min; p95 >2 s por 10 min; heap >85%; pool JDBC >80%; MariaDB/Redis no disponible. Deben ajustarse tras medir una linea base real. |
| Frecuencia y responsable | Recoleccion cada 15-30 s; revision diaria por soporte/backend y semanal de capacidad. |

### 10.3 Monitoreo de infraestructura

| Aspecto | Plan propuesto |
|---|---|
| Objetivo | Detectar agotamiento o reinicios de contenedores, almacenamiento y recursos de MariaDB/Redis antes de indisponibilidad. |
| Implementacion | cAdvisor para contenedores, node_exporter para host, mysqld_exporter y redis_exporter; panel Grafana por servidor/servicio. |
| Metricas | CPU, RAM, reinicios, disco, volumen MariaDB, volumen Redis, carpeta `uploads`, conexiones BD, slow queries, locks, buffer pool, memoria Redis, evictions, persistencia y latencia. |
| Umbrales iniciales | Disco >80% aviso y >90% critico; reinicios repetidos; conexiones MariaDB >80%; Redis evictions >0; memoria >85%; backup fallido. |
| Frecuencia y responsable | Recoleccion cada 30 s; revision diaria por operaciones y semanal por responsable de BD. |

### 10.4 Monitoreo de red y disponibilidad

| Aspecto | Plan propuesto |
|---|---|
| Objetivo | Medir si el operador puede abrir la SPA y consumir API desde su red real. |
| Implementacion | Uptime Kuma o Prometheus Blackbox Exporter para sondas externas; Nginx access/error logs en JSON o exporter de Nginx. Agregar healthcheck de backend y frontend. |
| Metricas | Disponibilidad de `/`, readiness de API que incluya MariaDB y Redis, DNS, conexion, TLS si existe, TTFB, latencia upstream, ancho de banda, 4xx/5xx y timeouts. |
| Umbrales iniciales | Dos fallos consecutivos de sonda; p95 >2 s durante 10 min; 5xx >1%; error de DNS/TLS inmediato. |
| Frecuencia y responsable | Sondas cada 1 min; alerta inmediata a soporte/operaciones; informe semanal de disponibilidad. |

La readiness debe ser distinta de liveness. Liveness responde si el proceso backend vive; readiness confirma que MariaDB y Redis estan disponibles para atender una operacion autenticada. Actualmente el endpoint generico no debe usarse como unica senal de disponibilidad.

### 10.5 Monitoreo de experiencia de usuario (UX)

| Aspecto | Plan propuesto |
|---|---|
| Objetivo | Conocer errores y lentitud que realmente experimenta el operador en login, POS, cocina y cobro. |
| Implementacion | Sentry para React con releases, sourcemaps y captura de excepciones; Web Vitals para LCP, INP y CLS; Playwright sintetico en staging con una cuenta de prueba aislada. |
| Metricas | Errores JavaScript, promesas no manejadas, errores API por pagina/release, LCP/INP/CLS p75, tasa de exito y duracion de login, alta de pedido, envio a cocina y cobro. |
| Flujos sinteticos | Login -> abrir caja -> crear pedido -> enviar cocina -> completar pedido -> cobrar -> comprobar kardex. El entorno debe ser staging o datos de prueba aislados, nunca produccion sin controles. |
| Umbrales iniciales | Error frontend >1%; LCP p75 >2.5 s; regresion relevante de INP/CLS; un fallo consecutivo del flujo POS-cobro durante horario operativo. |
| Frecuencia y responsable | Captura continua en produccion; sintetico cada 5 min en horario operativo y por commit en CI; revision por frontend/QA. |

### 10.6 Monitoreo de negocio y operacion del restaurante

Las cuatro categorias de monitoreo deben complementarse con indicadores del dominio. Estas metricas convierten senales tecnicas en acciones para cocina, caja y administracion.

| Indicador | Fuente | Alerta/accion sugerida |
|---|---|---|
| Pedidos en cocina y tiempo de espera | Pedido, detalle, cocina, historial de estados. | Pedido en cocina mas de 10 min sobre el objetivo: avisar al encargado de cocina. |
| Cobros exitosos/fallidos | Caja, venta, pago, correlativo y logs API. | Mas de dos cobros fallidos en 10 min: revisar caja, metodos de pago, BD y API. |
| Pedidos servidos sin cobro | Pedido, precuenta, caja y venta. | Pedido entregado/cuenta sin cobro por mas de 30 min: aviso a caja. |
| Stock bajo, agotado o proximo a vencer | Lotes, movimientos, reportes y compra. | Avisar a compras; usar velocidad de consumo para estimar fecha de reposicion. |
| Caja abierta fuera de turno | Caja, empleado, sesion y auditoria. | Aviso a encargado y revision de cierre/responsable. |
| Intentos de login fallidos | Alertas de seguridad, sesiones, logs. | Umbral de intentos por usuario/IP: bloquear o investigar segun politica. |

### 10.7 Fases de implementacion del monitoreo

| Prioridad | Acciones | Resultado esperado |
|---|---|---|
| P0: operacion segura | Corregir/reproducir artefactos E2E con 5xx; readiness real de MariaDB/Redis; healthchecks backend/frontend; logs estructurados con correlation ID; sonda externa; E2E sintetico de POS-cocina-cobro. | Detectar caidas y fallos del flujo de venta antes o durante la atencion, con una alerta accionable. |
| P1: APM e infraestructura | Actuator, Micrometer, Prometheus, Grafana, Alertmanager, exporters y dashboards de API/JVM/BD/Redis/contenedores. | Medir capacidad, errores y degradacion con tendencias para habilitar mantenimiento predictivo. |
| P2: UX y negocio | Sentry/Web Vitals, dashboard de tiempos de cocina/cobro/stock, alertas por turno y procedimiento de escalamiento. | Priorizar incidentes segun impacto real en operadores y clientes. |

### 10.8 Responsables y respuesta ante alertas

| Alerta | Primer responsable | Escalamiento | Accion inicial |
|---|---|---|---|
| Backend, BD o Redis no disponible | Soporte/operaciones | Backend y responsable de infraestructura | Revisar readiness, logs por correlation ID, recursos y reinicio controlado. |
| POS/cobro falla | Caja o encargado de turno | Soporte, backend y frontend | Registrar hora/pedido/correlation ID; usar procedimiento de contingencia; no duplicar cobro. |
| Cocina acumulada | Encargado de cocina | Administracion | Redistribuir carga, revisar comandas y tiempo de preparacion. |
| Stock/vencimiento critico | Compras/almacen | Administracion | Confirmar lote, planificar compra/rotacion y evitar venta no disponible. |
| Seguridad/sesiones anormales | Administrador del sistema | Soporte/backend | Cerrar sesion, revisar auditoria, rotar credenciales si corresponde. |

## 11. Prioridades tecnicas sugeridas

1. Corregir autorizacion backend por endpoint y proteger la auditoria/seguridad/roles/empleados.
2. Endurecer la carga por URL y rotar/eliminar credenciales seed fuera de desarrollo.
3. Garantizar atomicidad e idempotencia de cobro, venta, caja, pedido, mesa, FIFO y kardex.
4. Resolver concurrencia de lotes con pruebas MariaDB reales.
5. Revisar calculos de costo/utilidad y trazabilidad de anulaciones.
6. Agregar paginacion, eliminar N+1 criticos y consolidar invalidaciones de React Query.
7. Mejorar resiliencia de frontend: 404, error boundary, URL API por ambiente y persistencia/recuperacion de carrito por mesa.
8. Incrementar cobertura E2E para permisos, flujos concurrentes, errores y roles de operacion.

## 12. Matriz de verificacion recomendada

| Objetivo | Comando o procedimiento |
|---|---|
| Compilacion backend | Desde `backend/`: `mvn test`. |
| Integracion real backend | Configurar MariaDB/Redis de prueba y ejecutar `RUN_MARIADB_INTEGRATION=true mvn -Dtest=SmokeApiIntegrationTest test`. |
| Calidad frontend | Desde `frontend/`: `npm run lint`, `npm test`, `npm run build`. |
| Contratos | Desde `frontend/`: `npm run contracts:generate` y `npm run contracts:check`. |
| Smoke estructural | Desde `frontend/`: `npm run test:smoke`. |
| E2E de auditoria | Con servicios disponibles: `npm run test:e2e:audit`. |
| E2E de precios POS | Desde `frontend/`: `npm run test:pos-pricing`. |
| Revision visual | Desde `frontend/`: `npm run visual:validate`. |
| Sistema completo | Desde raiz: `docker compose up --build`; comprobar `http://localhost`, `http://localhost:8080/api/v1/health` y `/v3/api-docs`. |

## 13. Conclusion

La separacion por capas es adecuada: el backend contiene entidades, repositorios, servicios, politicas y controladores; el frontend separa rutas, paginas, adaptadores API, hooks y componentes reutilizables. El flujo principal de negocio esta trazado de compra a lote, de pedido a cocina y de cobro a venta/inventario/caja.

La mayor prioridad no es agregar mas pantallas, sino asegurar que los limites de seguridad y las transacciones criticas sean correctos bajo roles reales y concurrencia. Mantener el contrato OpenAPI actualizado, usar Flyway para toda evolucion de esquema y validar los flujos con MariaDB/Redis reales permitira que frontend y backend evolucionen sin perder consistencia.
