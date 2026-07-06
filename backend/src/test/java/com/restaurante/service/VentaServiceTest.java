package com.restaurante.service;

import com.restaurante.dto.CobrarPedidoRequest;
import com.restaurante.dto.VentaPagoRequest;
import com.restaurante.dto.mapper.VentaMapper;
import com.restaurante.dto.response.CajaResponse;
import com.restaurante.dto.response.VentaResponse;
import com.restaurante.entity.*;
import com.restaurante.repository.*;
import com.restaurante.service.policy.VentaPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VentaServiceTest {

    @InjectMocks
    private VentaService ventaService;

    @Mock private VentaRepository ventaRepository;
    @Mock private DetalleVentaRepository detalleVentaRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private RecetaProductoRepository recetaProductoRepository;
    @Mock private ComboDetalleRepository comboDetalleRepository;
    @Mock private ConsumoInsumoVentaRepository consumoInsumoVentaRepository;
    @Mock private MovimientoInventarioRepository movimientoInventarioRepository;
    @Mock private LoteInsumoService loteInsumoService;
    @Mock private LoteProductoService loteProductoService;
    @Mock private LoteProductoRepository loteProductoRepository;
    @Mock private CajaService cajaService;
    @Mock private CajaRepository cajaRepository;
    @Mock private PedidoRepository pedidoRepository;
    @Mock private DetallePedidoRepository detallePedidoRepository;
    @Mock private PedidoExtraRepository pedidoExtraRepository;
    @Mock private MetodoPagoRepository metodoPagoRepository;
    @Mock private VentaPagoRepository ventaPagoRepository;
    @Mock private ConfiguracionEmpresaRepository configuracionEmpresaRepository;
    @Mock private PrecuentaService precuentaService;
    @Mock private VentaMapper ventaMapper;
    @Mock private VentaPolicy ventaPolicy;
    @Mock private CorrelativoDocumentoService correlativoDocumentoService;

    private Empleado empleado;
    private Caja caja;
    private Pedido pedido;
    private Producto producto;
    private MetodoPago metodoPago;
    private ConfiguracionEmpresa config;

    @BeforeEach
    void setUp() {
        empleado = new Empleado();
        empleado.setIdEmpleado(99);
        empleado.setNombre("Test");
        empleado.setApellido("Cajero");

        caja = new Caja();
        caja.setIdCaja(1);
        caja.setEstado(Caja.Estado.ABIERTA);
        caja.setEmpleado(empleado);
        caja.setMontoSistema(BigDecimal.ZERO);

        CajaResponse cajaResponse = new CajaResponse();
        cajaResponse.setIdCaja(1);
        cajaResponse.setEstado("ABIERTA");

        pedido = new Pedido();
        pedido.setIdPedido(10);
        pedido.setEstado(Pedido.Estado.CUENTA);
        pedido.setTotal(new BigDecimal("10.00"));
        pedido.setSubtotal(new BigDecimal("8.47"));
        pedido.setIgv(new BigDecimal("1.53"));

        producto = new Producto();
        producto.setIdProducto(1);
        producto.setNombre("Test Producto");
        producto.setTipoProducto(Producto.TipoProducto.INVENTARIO_DIRECTO);
        producto.setEsSku(true);
        producto.setPrecio(new BigDecimal("10.00"));

        metodoPago = new MetodoPago();
        metodoPago.setIdMetodoPago(1);
        metodoPago.setNombre("Efectivo");
        metodoPago.setRequiereReferencia(false);

        config = new ConfiguracionEmpresa();
        config.setIdConfiguracion(1);
        config.setSerieBoleta("B001");
        config.setSerieFactura("F001");
        config.setIgv(new BigDecimal("18.00"));

        when(cajaService.obtenerCajaAbiertaParaEmpleado(any())).thenReturn(Optional.of(cajaResponse));
        when(cajaRepository.findById(anyInt())).thenReturn(Optional.of(caja));

        LoteProducto lote = new LoteProducto();
        lote.setIdLoteProducto(10);
        lote.setCantidadDisponible(100);
        lote.setCostoUnitario(new BigDecimal("5.00"));
        lote.setEstado(LoteProducto.Estado.DISPONIBLE);

        when(loteProductoRepository.sumDisponibleByProducto(anyInt())).thenReturn(100L);
        when(loteProductoService.descontarFifo(any(Producto.class), anyInt()))
                .thenReturn(List.of(new LoteProductoService.DescuentoLoteProducto(lote, 1)));
        when(movimientoInventarioRepository.save(any(MovimientoInventario.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(i -> i.getArgument(0));
        when(pedidoExtraRepository.findByDetallePedidoIdDetallePedido(anyInt()))
                .thenReturn(List.of());
    }

    private CobrarPedidoRequest crearRequest(String tipoComprobante) {
        VentaPagoRequest pagoReq = new VentaPagoRequest();
        pagoReq.setIdMetodoPago(1);
        pagoReq.setMonto(new BigDecimal("10.00"));
        return crearRequest(tipoComprobante, List.of(pagoReq));
    }

    private CobrarPedidoRequest crearRequest(String tipoComprobante, List<VentaPagoRequest> pagos) {
        CobrarPedidoRequest request = new CobrarPedidoRequest();
        request.setTipoComprobante(tipoComprobante);
        request.setPagos(pagos);
        return request;
    }

    private DetallePedido crearDetallePedido(int cantidad) {
        DetallePedido dp = new DetallePedido();
        dp.setIdDetallePedido(cantidad);
        dp.setProducto(producto);
        dp.setCantidad(cantidad);
        dp.setPrecioUnitario(new BigDecimal("10.00"));
        dp.setSubtotal(new BigDecimal(cantidad * 10));
        return dp;
    }

    private void setupMocksComunes(String tipoComprobante, List<DetallePedido> detalles) {
        when(pedidoRepository.findById(anyInt())).thenReturn(Optional.of(pedido));
        when(detallePedidoRepository.findByPedidoIdPedido(anyInt())).thenReturn(detalles);
        when(configuracionEmpresaRepository.findAll()).thenReturn(List.of(config));
        when(metodoPagoRepository.findById(anyInt())).thenReturn(Optional.of(metodoPago));

        when(ventaRepository.save(any(Venta.class))).thenAnswer(invocation -> {
            Venta v = invocation.getArgument(0);
            v.setIdVenta(100);
            return v;
        });

        when(detalleVentaRepository.save(any(DetalleVenta.class))).thenAnswer(invocation -> {
            DetalleVenta dv = invocation.getArgument(0);
            if (dv.getIdDetalle() == null) dv.setIdDetalle(1);
            return dv;
        });

        when(ventaPagoRepository.save(any(VentaPago.class))).thenAnswer(i -> i.getArgument(0));

        doNothing().when(precuentaService).marcarConvertida(any(Pedido.class));

        when(detalleVentaRepository.findByVentaIdVenta(anyInt())).thenAnswer(invocation -> {
            List<DetalleVenta> result = new ArrayList<>();
            for (DetallePedido dp : detalles) {
                DetalleVenta dv = new DetalleVenta();
                dv.setIdDetalle(dp.getIdDetallePedido());
                dv.setProducto(dp.getProducto());
                dv.setCombo(dp.getCombo());
                dv.setCantidad(dp.getCantidad());
                dv.setPrecioUnitario(dp.getPrecioUnitario());
                dv.setSubtotal(dp.getSubtotal());
                result.add(dv);
            }
            return result;
        });
        when(ventaPagoRepository.findByVentaIdVenta(anyInt())).thenReturn(List.of());

        when(ventaMapper.toResponse(any(Venta.class), anyList(), anyList()))
                .thenAnswer(i -> {
                    Venta v = i.getArgument(0);
                    VentaResponse vr = new VentaResponse();
                    vr.setIdVenta(v.getIdVenta());
                    vr.setSerie(v.getSerie());
                    vr.setNumero(v.getNumero());
                    vr.setTipoComprobante(v.getTipoComprobante() != null ? v.getTipoComprobante().name() : null);
                    vr.setEstado(v.getEstado() != null ? v.getEstado().name() : "EMITIDA");
                    return vr;
                });
    }

    @Test
    void cobrarConBoleta_generaNumeroNoNulo() {
        String numeroEsperado = "000042";
        when(correlativoDocumentoService.generarNumero(Venta.TipoComprobante.BOLETA, "B001"))
                .thenReturn(numeroEsperado);
        setupMocksComunes("BOLETA", List.of(crearDetallePedido(1)));

        VentaResponse response = ventaService.generarVentaPagadaDesdePedido(
                10, crearRequest("BOLETA"), empleado);

        assertNotNull(response.getNumero());
        assertEquals(numeroEsperado, response.getNumero());
        assertEquals("B001", response.getSerie());
        assertEquals("BOLETA", response.getTipoComprobante());
    }

    @Test
    void cobrarConFactura_generaNumeroNoNulo() {
        pedido.setCliente(new Cliente());
        pedido.getCliente().setTipoDocumento(Cliente.TipoDocumento.RUC);
        pedido.getCliente().setDocumentoIdentidad("20123456789");

        String numeroEsperado = "000043";
        when(correlativoDocumentoService.generarNumero(Venta.TipoComprobante.FACTURA, "F001"))
                .thenReturn(numeroEsperado);
        setupMocksComunes("FACTURA", List.of(crearDetallePedido(1)));

        VentaResponse response = ventaService.generarVentaPagadaDesdePedido(
                10, crearRequest("FACTURA"), empleado);

        assertNotNull(response.getNumero());
        assertEquals(numeroEsperado, response.getNumero());
        assertEquals("F001", response.getSerie());
        assertEquals("FACTURA", response.getTipoComprobante());
    }

    @Test
    void cobrarConTicket_generaNumeroNoNulo() {
        String numeroEsperado = "000044";
        when(correlativoDocumentoService.generarNumero(Venta.TipoComprobante.TICKET, "T001"))
                .thenReturn(numeroEsperado);
        setupMocksComunes("TICKET", List.of(crearDetallePedido(1)));

        VentaResponse response = ventaService.generarVentaPagadaDesdePedido(
                10, crearRequest("TICKET"), empleado);

        assertNotNull(response.getNumero());
        assertEquals(numeroEsperado, response.getNumero());
        assertEquals("T001", response.getSerie());
        assertEquals("TICKET", response.getTipoComprobante());
    }

    @Test
    void dosCobrosConsecutivos_generanNumerosDistintos() {
        when(correlativoDocumentoService.generarNumero(Venta.TipoComprobante.TICKET, "T001"))
                .thenReturn("000001")
                .thenReturn("000002");

        setupMocksComunes("TICKET", List.of(crearDetallePedido(1)));
        VentaResponse primera = ventaService.generarVentaPagadaDesdePedido(
                10, crearRequest("TICKET"), empleado);
        String numeroPrimera = primera.getNumero();

        pedido.setIdPedido(11);
        setupMocksComunes("TICKET", List.of(crearDetallePedido(1)));
        VentaResponse segunda = ventaService.generarVentaPagadaDesdePedido(
                11, crearRequest("TICKET"), empleado);
        String numeroSegunda = segunda.getNumero();

        assertNotNull(numeroPrimera);
        assertNotNull(numeroSegunda);
        assertNotEquals(numeroPrimera, numeroSegunda);
    }

    @Test
    void cuandoFallaPersistencia_noSePersisteVentaNiMovimiento() {
        when(correlativoDocumentoService.generarNumero(Venta.TipoComprobante.TICKET, "T001"))
                .thenReturn("000099");
        setupMocksComunes("TICKET", List.of(crearDetallePedido(1)));

        when(detalleVentaRepository.save(any(DetalleVenta.class)))
                .thenThrow(new RuntimeException("Fallo simulado en detalle venta"));

        assertThrows(RuntimeException.class, () ->
                ventaService.generarVentaPagadaDesdePedido(10, crearRequest("TICKET"), empleado));

        verify(pedidoRepository, never()).save(argThat(p -> p.getEstado() == Pedido.Estado.CERRADO));
        verify(cajaService, never()).registrarMovimiento(anyInt(), any(), anyString(), any(), any(), anyString(), anyInt(), anyString());
        verify(precuentaService, never()).marcarConvertida(any());
    }

    @Test
    void pedidoCobrado_yaNoAparecePendiente() {
        when(pedidoRepository.findById(anyInt())).thenAnswer(i -> {
            Pedido p = new Pedido();
            p.setIdPedido(i.getArgument(0));
            p.setEstado(Pedido.Estado.CUENTA);
            return Optional.of(p);
        });

        String numeroEsperado = "000055";
        when(correlativoDocumentoService.generarNumero(Venta.TipoComprobante.BOLETA, "B001"))
                .thenReturn(numeroEsperado);
        setupMocksComunes("BOLETA", List.of(crearDetallePedido(1)));

        VentaResponse response = ventaService.generarVentaPagadaDesdePedido(
                10, crearRequest("BOLETA"), empleado);

        assertNotNull(response);
        assertEquals("EMITIDA", response.getEstado());

        ArgumentCaptor<Pedido> pedidoCaptor = ArgumentCaptor.forClass(Pedido.class);
        verify(pedidoRepository, atLeastOnce()).save(pedidoCaptor.capture());

        boolean algunoCerrado = pedidoCaptor.getAllValues().stream()
                .anyMatch(p -> p.getEstado() == Pedido.Estado.CERRADO);
        assertTrue(algunoCerrado, "El pedido debe quedar en estado CERRADO tras el cobro");
    }
}
