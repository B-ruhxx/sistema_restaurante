package com.restaurante.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.sql.DriverManager;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@EnabledIfEnvironmentVariable(named = "RUN_MARIADB_INTEGRATION", matches = "true")
class SmokeApiIntegrationTest {

    private static final String DB_NAME = env("TEST_DB_NAME", "backend_integration_test");
    private static final String DB_HOST = env("TEST_DB_HOST", "127.0.0.1");
    private static final String DB_PORT = env("TEST_DB_PORT", "3306");
    private static final String DB_USER = env("TEST_DB_USER", "root");
    private static final String DB_PASSWORD = env("TEST_DB_PASSWORD", "260718");
    private static final String JWT_SECRET = env(
            "TEST_JWT_SECRET",
            "9a4f2c8d3e7b1a5c6d8e0f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c");

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate rest;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        resetDatabase();
        registry.add("spring.datasource.url", () -> jdbcUrl(DB_NAME));
        registry.add("spring.datasource.username", () -> DB_USER);
        registry.add("spring.datasource.password", () -> DB_PASSWORD);
        registry.add("jwt.secret", () -> JWT_SECRET);
        registry.add("spring.data.redis.host", () -> env("TEST_REDIS_HOST", "127.0.0.1"));
        registry.add("spring.data.redis.port", () -> env("TEST_REDIS_PORT", "6379"));
        registry.add("app.seed.demo-data", () -> "false");
    }

    @Test
    void smokeRfCompletoPorApiConJwtReal() {
        String token = login();
        HttpHeaders auth = authHeaders(token);

        Map<String, Object> padre = post(auth, "/api/v1/productos/padres", Map.of(
                "nombre", "Agua embotellada",
                "descripcion", "Producto padre smoke"), HttpStatus.OK);
        int idPadre = id(padre, "producto", "idProducto");

        Map<String, Object> sku = post(auth, "/api/v1/productos/" + idPadre + "/skus", Map.of(
                "nombre", "Agua embotellada 500ml",
                "sku", "SMOKE-AGUA-500",
                "precio", new BigDecimal("5.00"),
                "tipoProducto", "INVENTARIO_DIRECTO"), HttpStatus.OK);
        int idSku = id(sku, "producto", "idProducto");
        String skuCode = String.valueOf(((Map<?, ?>) sku.get("producto")).get("sku"));

        LocalDate vencimientoTemprano = LocalDate.now().plusMonths(1);
        LocalDate vencimientoTardio = LocalDate.now().plusMonths(6);
        post(auth, "/api/v1/compras", Map.of(
                "idProveedor", crearProveedor(auth),
                "detalles", List.of(Map.of(
                        "idProducto", idSku,
                        "cantidad", 3,
                        "precioUnitario", new BigDecimal("2.00"),
                        "fechaVencimiento", vencimientoTemprano.toString())),
                "observacion", "Compra smoke lote temprano"), HttpStatus.OK);

        post(auth, "/api/v1/compras", Map.of(
                "idProveedor", crearProveedor(auth),
                "detalles", List.of(Map.of(
                        "idProducto", idSku,
                        "cantidad", 7,
                        "precioUnitario", new BigDecimal("2.20"),
                        "fechaVencimiento", vencimientoTardio.toString())),
                "observacion", "Compra smoke lote tardio"), HttpStatus.OK);

        List<Map<String, Object>> lotesIniciales = getList(auth, "/api/v1/productos/" + idSku + "/lotes", HttpStatus.OK);
        assertEquals(2, lotesIniciales.size());
        assertEquals(vencimientoTemprano.toString(), lotesIniciales.get(0).get("fechaVencimiento"));
        assertEquals(3, intField(lotesIniciales.get(0), "cantidadDisponible"));
        assertEquals(7, intField(lotesIniciales.get(1), "cantidadDisponible"));

        post(auth, "/api/v1/compras", Map.of(
                "idProveedor", crearProveedor(auth),
                "detalles", List.of(Map.of(
                        "idProducto", idPadre,
                        "cantidad", 1,
                        "precioUnitario", new BigDecimal("1.00"),
                "fechaVencimiento", LocalDate.now().plusMonths(6).toString()))), HttpStatus.CONFLICT);

        post(auth, "/api/v1/pedidos", Map.of("detalles", List.of()), HttpStatus.BAD_REQUEST);

        int idMesa = id(post(auth, "/api/v1/mesas", Map.of(
                "numero", "S-" + System.currentTimeMillis(),
                "capacidad", 2,
                "ubicacion", "Smoke"), HttpStatus.OK), "idMesa");
        int idPedido = id(post(auth, "/api/v1/mesas/" + idMesa + "/abrir-pedido", Map.of(), HttpStatus.OK), "idPedido");

        post(auth, "/api/v1/pedidos/" + idPedido + "/detalles", Map.of(
                "idProducto", idSku,
                "cantidad", 5,
                "observacion", "Smoke directo"), HttpStatus.OK);

        Map<String, Object> pedidoServido = post(auth, "/api/v1/pedidos/" + idPedido + "/enviar-cocina", Map.of(), HttpStatus.OK);
        assertEquals("SERVIDO", pedidoServido.get("estado"));

        ResponseEntity<List> comandas = rest.exchange(
                url("/api/v1/cocina/comandas"),
                HttpMethod.GET,
                new HttpEntity<>(auth),
                List.class);
        assertEquals(HttpStatus.OK, comandas.getStatusCode());
        assertTrue(comandas.getBody() == null || comandas.getBody().isEmpty(), "Un SKU directo no debe entrar al KDS.");

        post(auth, "/api/v1/pedidos/" + idPedido + "/precuentas", Map.of(), HttpStatus.OK);
        int idCaja = id(post(auth, "/api/v1/cajas/abrir", Map.of(
                "montoApertura", new BigDecimal("100.00"),
                "observacion", "Smoke caja"), HttpStatus.OK), "idCaja");

        Map<String, Object> venta = post(auth, "/api/v1/cajas/pedidos/" + idPedido + "/cobrar", Map.of(
                "tipoComprobante", "BOLETA",
                "serie", "B001",
                "numero", "900001",
                "pagos", List.of(Map.of(
                        "idMetodoPago", 1,
                        "monto", new BigDecimal("25.00")))), HttpStatus.OK);
        int idVenta = id(venta, "idVenta");
        assertEquals("EMITIDA", venta.get("estado"));

        List<Map<String, Object>> lotesDespuesVenta = getList(auth, "/api/v1/productos/" + idSku + "/lotes", HttpStatus.OK);
        assertEquals(0, intField(lotesDespuesVenta.get(0), "cantidadDisponible"),
                "FIFO debe consumir primero el lote con vencimiento mas cercano.");
        assertEquals(5, intField(lotesDespuesVenta.get(1), "cantidadDisponible"));

        Map<String, Object> ajuste = post(auth, "/api/v1/inventario/ajustes", Map.of(
                "tipoRecurso", "PRODUCTO",
                "idProducto", idSku,
                "cantidad", 1,
                "motivo", "Smoke ajuste formal"), HttpStatus.OK);
        assertNotNull(ajuste.get("idAjuste"));
        assertEquals("PRODUCTO", ajuste.get("tipoRecurso"));
        assertFalse(((List<Map<String, Object>>) ajuste.get("movimientos")).isEmpty());
        Map<String, Object> movimientoAjuste = ((List<Map<String, Object>>) ajuste.get("movimientos")).get(0);
        assertEquals("AJUSTE_INVENTARIO", movimientoAjuste.get("referenceType"));
        assertEquals(((Number) ajuste.get("idAjuste")).intValue(), ((Number) movimientoAjuste.get("referenceId")).intValue());

        Map<String, Object> anulada = post(auth, "/api/v1/ventas/" + idVenta + "/anular", Map.of(
                "motivo", "Smoke anulacion"), HttpStatus.OK);
        assertEquals("ANULADA", anulada.get("estado"));

        List<Map<String, Object>> lotesDespuesAnulacion = getList(auth, "/api/v1/productos/" + idSku + "/lotes", HttpStatus.OK);
        assertEquals(3, intField(lotesDespuesAnulacion.get(0), "cantidadDisponible"),
                "La anulacion debe devolver stock al lote consumido originalmente.");
        assertEquals(6, intField(lotesDespuesAnulacion.get(1), "cantidadDisponible"));

        post(auth, "/api/v1/inventario/ajustes", Map.of(
                "tipoRecurso", "PRODUCTO",
                "idProducto", idSku,
                "cantidad", 99,
                "motivo", "Smoke stock insuficiente"), HttpStatus.CONFLICT);

        ResponseEntity<List<Map<String, Object>>> movimientosCaja = rest.exchange(
                url("/api/v1/cajas/" + idCaja + "/movimientos"),
                HttpMethod.GET,
                new HttpEntity<>(auth),
                (Class<List<Map<String, Object>>>) (Class<?>) List.class);
        assertEquals(HttpStatus.OK, movimientosCaja.getStatusCode());
        assertFalse(movimientosCaja.getBody().isEmpty());

        assertSecurityGuards(auth, skuCode, idPedido);
    }

    private void assertSecurityGuards(HttpHeaders adminAuth, String skuCode, int idPedido) {
        ResponseEntity<Map<String, Object>> sinToken = rest.exchange(
                url("/api/v1/productos/padres"),
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                (Class<Map<String, Object>>) (Class<?>) Map.class);
        assertEquals(HttpStatus.UNAUTHORIZED, sinToken.getStatusCode());

        HttpHeaders invalidAuth = new HttpHeaders();
        invalidAuth.setBearerAuth("token-invalido");
        ResponseEntity<Map<String, Object>> tokenInvalido = rest.exchange(
                url("/api/v1/productos/padres"),
                HttpMethod.GET,
                new HttpEntity<>(invalidAuth),
                (Class<Map<String, Object>>) (Class<?>) Map.class);
        assertEquals(HttpStatus.UNAUTHORIZED, tokenInvalido.getStatusCode());

        Integer idRolCocina = getList(adminAuth, "/api/v1/empleados/roles", HttpStatus.OK).stream()
                .filter(rol -> "COCINA".equals(rol.get("nombre")))
                .map(rol -> ((Number) rol.get("idRol")).intValue())
                .findFirst()
                .orElseThrow();
        String usuarioCocina = "cocina_smoke_" + System.nanoTime();
        post(adminAuth, "/api/v1/empleados", Map.of(
                "nombre", "Cocina",
                "apellido", "Smoke",
                "username", usuarioCocina,
                "password", "Smoke123!",
                "email", usuarioCocina + "@restaurante.local",
                "estado", "ACTIVO",
                "idRol", idRolCocina), HttpStatus.OK);
        HttpHeaders cocinaAuth = authHeaders(login(usuarioCocina, "Smoke123!"));

        ResponseEntity<Map<String, Object>> rolInsuficiente = rest.exchange(
                url("/api/v1/cajas/abrir"),
                HttpMethod.POST,
                new HttpEntity<>(Map.of(
                        "montoApertura", new BigDecimal("10.00"),
                        "observacion", "No permitido " + skuCode), cocinaAuth),
                (Class<Map<String, Object>>) (Class<?>) Map.class);
        assertEquals(HttpStatus.FORBIDDEN, rolInsuficiente.getStatusCode());

        ResponseEntity<Map<String, Object>> cancelacionSinSupervisor = rest.exchange(
                url("/api/v1/pedidos/" + idPedido + "/cancelar"),
                HttpMethod.POST,
                new HttpEntity<>(Map.of("motivo", "No autorizado " + skuCode), cocinaAuth),
                (Class<Map<String, Object>>) (Class<?>) Map.class);
        assertEquals(HttpStatus.FORBIDDEN, cancelacionSinSupervisor.getStatusCode());
    }

    private int crearProveedor(HttpHeaders auth) {
        Map<String, Object> proveedor = post(auth, "/api/v1/proveedores", Map.of(
                "razonSocial", "Proveedor Smoke " + System.nanoTime(),
                "ruc", "20" + String.valueOf(System.nanoTime()).substring(0, 9),
                "contacto", "QA"), HttpStatus.OK);
        return id(proveedor, "idProveedor");
    }

    private String login() {
        return login("admin", "admin123");
    }

    private String login(String username, String password) {
        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/v1/auth/login"),
                Map.of("username", username, "password", password),
                Map.class);
        assertEquals(HttpStatus.OK, response.getStatusCode(), "El usuario de prueba debe poder iniciar sesion.");
        Object token = response.getBody().get("token");
        assertNotNull(token);
        return token.toString();
    }

    private Map<String, Object> post(HttpHeaders headers, String path, Map<String, ?> body, HttpStatus expectedStatus) {
        ResponseEntity<Map<String, Object>> response = rest.exchange(
                url(path),
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                (Class<Map<String, Object>>) (Class<?>) Map.class);
        assertEquals(expectedStatus, response.getStatusCode(), "POST " + path + " -> " + response.getBody());
        return response.getBody();
    }

    private List<Map<String, Object>> getList(HttpHeaders headers, String path, HttpStatus expectedStatus) {
        ResponseEntity<List<Map<String, Object>>> response = rest.exchange(
                url(path),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                (Class<List<Map<String, Object>>>) (Class<?>) List.class);
        assertEquals(expectedStatus, response.getStatusCode(), "GET " + path + " -> " + response.getBody());
        return response.getBody();
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private static int id(Map<String, Object> body, String field) {
        return ((Number) body.get(field)).intValue();
    }

    private static int id(Map<String, Object> body, String nested, String field) {
        return ((Number) ((Map<String, Object>) body.get(nested)).get(field)).intValue();
    }

    private static int intField(Map<String, Object> body, String field) {
        return ((Number) body.get(field)).intValue();
    }

    private static void resetDatabase() {
        try (var connection = DriverManager.getConnection(adminJdbcUrl(), DB_USER, DB_PASSWORD);
                var statement = connection.createStatement()) {
            statement.executeUpdate("DROP DATABASE IF EXISTS " + DB_NAME);
            statement.executeUpdate("CREATE DATABASE " + DB_NAME + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo resetear la base MariaDB de integracion.", ex);
        }
    }

    private static String adminJdbcUrl() {
        return "jdbc:mariadb://" + DB_HOST + ":" + DB_PORT + "/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    }

    private static String jdbcUrl(String database) {
        return "jdbc:mariadb://" + DB_HOST + ":" + DB_PORT + "/" + database
                + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    }

    private static String env(String key, String defaultValue) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
