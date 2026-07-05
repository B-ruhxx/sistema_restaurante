package com.restaurante.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurante.dto.CompraRequest;
import com.restaurante.dto.DetalleCompraRequest;
import com.restaurante.dto.mapper.CompraMapper;
import com.restaurante.dto.response.CompraResponse;
import com.restaurante.entity.CompraInsumo;
import com.restaurante.entity.DetalleCompraInsumo;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Insumo;
import com.restaurante.entity.LoteInsumo;
import com.restaurante.entity.LoteProducto;
import com.restaurante.entity.MovimientoInventario;
import com.restaurante.entity.Producto;
import com.restaurante.entity.Proveedor;
import com.restaurante.repository.CompraInsumoRepository;
import com.restaurante.repository.DetalleCompraInsumoRepository;
import com.restaurante.repository.InsumoRepository;
import com.restaurante.repository.LoteInsumoRepository;
import com.restaurante.repository.LoteProductoRepository;
import com.restaurante.repository.MovimientoInventarioRepository;
import com.restaurante.repository.ProductoRepository;
import com.restaurante.repository.ProveedorRepository;
import com.restaurante.service.policy.ProductoPolicy;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CompraServiceTest {

    @Mock private CompraInsumoRepository compraInsumoRepository;
    @Mock private DetalleCompraInsumoRepository detalleCompraInsumoRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private MovimientoInventarioRepository movimientoInventarioRepository;
    @Mock private LoteInsumoRepository loteInsumoRepository;
    @Mock private LoteProductoRepository loteProductoRepository;
    @Mock private CompraMapper compraMapper;
    @Mock private ProductoPolicy productoPolicy;

    @InjectMocks
    private CompraService compraService;

    @Test
    void registrarCompraUsaStockContableParaCostoPromedioYSnapshot() {
        CompraRequest request = new CompraRequest();
        request.setIdProveedor(1);

        DetalleCompraRequest detalle = new DetalleCompraRequest();
        detalle.setIdInsumo(10);
        detalle.setNumeroLote("LOT-TEST");
        detalle.setCantidad(new BigDecimal("5.000"));
        detalle.setPrecioUnitario(new BigDecimal("4.00"));
        detalle.setFechaVencimiento(LocalDate.now().plusDays(10));
        request.setDetalles(List.of(detalle));

        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(1);
        proveedor.setRazonSocial("Proveedor Test");

        Empleado empleado = new Empleado();
        empleado.setIdEmpleado(2);

        Insumo insumo = new Insumo();
        insumo.setIdInsumo(10);
        insumo.setNombre("Harina");
        insumo.setStock(BigDecimal.ZERO);
        insumo.setCostoPromedio(new BigDecimal("2.00"));

        when(proveedorRepository.findById(1)).thenReturn(Optional.of(proveedor));
        when(insumoRepository.findById(10)).thenReturn(Optional.of(insumo));
        when(loteInsumoRepository.sumContableByInsumo(10)).thenReturn(new BigDecimal("10.000"));
        when(compraInsumoRepository.save(any())).thenAnswer(invocation -> {
            CompraInsumo compra = invocation.getArgument(0);
            compra.setIdCompra(99);
            return compra;
        });
        when(detalleCompraInsumoRepository.save(any())).thenAnswer(invocation -> {
            DetalleCompraInsumo det = invocation.getArgument(0);
            det.setIdDetalleCompra(55);
            return det;
        });
        when(insumoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(loteInsumoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(movimientoInventarioRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(detalleCompraInsumoRepository.findByCompraIdCompra(99)).thenReturn(List.of());
        when(compraMapper.toResponse(any(), any())).thenReturn(new CompraResponse());

        compraService.registrarCompra(request, empleado);

        ArgumentCaptor<Insumo> insumoCaptor = ArgumentCaptor.forClass(Insumo.class);
        verify(insumoRepository).save(insumoCaptor.capture());
        assertEquals(new BigDecimal("2.67"), insumoCaptor.getValue().getCostoPromedio());

        ArgumentCaptor<MovimientoInventario> movimientoCaptor = ArgumentCaptor.forClass(MovimientoInventario.class);
        verify(movimientoInventarioRepository).save(movimientoCaptor.capture());
        assertEquals(new BigDecimal("10.000"), movimientoCaptor.getValue().getStockAnterior());
        assertEquals(new BigDecimal("15.000"), movimientoCaptor.getValue().getStockNuevo());
    }

    @Test
    void registrarCompraCreaLoteInsumoVencidoConEstadoVencido() {
        CompraRequest request = new CompraRequest();
        request.setIdProveedor(1);

        DetalleCompraRequest detalle = new DetalleCompraRequest();
        detalle.setIdInsumo(10);
        detalle.setNumeroLote("LOT-INS-VEN");
        detalle.setCantidad(new BigDecimal("5.000"));
        detalle.setPrecioUnitario(new BigDecimal("4.00"));
        detalle.setFechaVencimiento(LocalDate.now().minusDays(1));
        request.setDetalles(List.of(detalle));

        prepararCompraInsumoBase(request, detalle);

        compraService.registrarCompra(request, empleadoBase());

        ArgumentCaptor<LoteInsumo> loteCaptor = ArgumentCaptor.forClass(LoteInsumo.class);
        verify(loteInsumoRepository).save(loteCaptor.capture());
        assertEquals(LoteInsumo.Estado.VENCIDO, loteCaptor.getValue().getEstado());
    }

    @Test
    void registrarCompraCreaLoteProductoVencidoConEstadoVencido() {
        CompraRequest request = new CompraRequest();
        request.setIdProveedor(1);

        DetalleCompraRequest detalle = new DetalleCompraRequest();
        detalle.setIdProducto(20);
        detalle.setNumeroLote("LOT-PROD-VEN");
        detalle.setCantidad(new BigDecimal("5"));
        detalle.setPrecioUnitario(new BigDecimal("4.00"));
        detalle.setFechaVencimiento(LocalDate.now().minusDays(1));
        request.setDetalles(List.of(detalle));

        prepararCompraProductoBase(request, detalle);

        compraService.registrarCompra(request, empleadoBase());

        ArgumentCaptor<LoteProducto> loteCaptor = ArgumentCaptor.forClass(LoteProducto.class);
        verify(loteProductoRepository).save(loteCaptor.capture());
        assertEquals(LoteProducto.Estado.VENCIDO, loteCaptor.getValue().getEstado());
    }

    @Test
    void registrarCompraCreaLoteVigenteConEstadoDisponible() {
        CompraRequest request = new CompraRequest();
        request.setIdProveedor(1);

        DetalleCompraRequest detalle = new DetalleCompraRequest();
        detalle.setIdInsumo(10);
        detalle.setNumeroLote("LOT-INS-DISP");
        detalle.setCantidad(new BigDecimal("5.000"));
        detalle.setPrecioUnitario(new BigDecimal("4.00"));
        detalle.setFechaVencimiento(LocalDate.now().plusDays(1));
        request.setDetalles(List.of(detalle));

        prepararCompraInsumoBase(request, detalle);

        compraService.registrarCompra(request, empleadoBase());

        ArgumentCaptor<LoteInsumo> loteCaptor = ArgumentCaptor.forClass(LoteInsumo.class);
        verify(loteInsumoRepository).save(loteCaptor.capture());
        assertEquals(LoteInsumo.Estado.DISPONIBLE, loteCaptor.getValue().getEstado());
    }

    private void prepararCompraInsumoBase(CompraRequest request, DetalleCompraRequest detalle) {
        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(1);
        proveedor.setRazonSocial("Proveedor Test");

        Insumo insumo = new Insumo();
        insumo.setIdInsumo(10);
        insumo.setNombre("Harina");
        insumo.setStock(BigDecimal.ZERO);
        insumo.setCostoPromedio(new BigDecimal("2.00"));

        when(proveedorRepository.findById(1)).thenReturn(Optional.of(proveedor));
        when(insumoRepository.findById(10)).thenReturn(Optional.of(insumo));
        when(loteInsumoRepository.sumContableByInsumo(10)).thenReturn(BigDecimal.ZERO);
        when(compraInsumoRepository.save(any())).thenAnswer(invocation -> {
            CompraInsumo compra = invocation.getArgument(0);
            compra.setIdCompra(99);
            return compra;
        });
        when(detalleCompraInsumoRepository.save(any())).thenAnswer(invocation -> {
            DetalleCompraInsumo det = invocation.getArgument(0);
            det.setIdDetalleCompra(55);
            return det;
        });
        when(insumoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(loteInsumoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(movimientoInventarioRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(detalleCompraInsumoRepository.findByCompraIdCompra(99)).thenReturn(List.of());
        when(compraMapper.toResponse(any(), any())).thenReturn(new CompraResponse());
    }

    private void prepararCompraProductoBase(CompraRequest request, DetalleCompraRequest detalle) {
        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(1);
        proveedor.setRazonSocial("Proveedor Test");

        Producto producto = new Producto();
        producto.setIdProducto(20);
        producto.setNombre("Agua");
        producto.setEsSku(true);
        producto.setTipoProducto(Producto.TipoProducto.INVENTARIO_DIRECTO);

        when(proveedorRepository.findById(1)).thenReturn(Optional.of(proveedor));
        when(productoRepository.findById(20)).thenReturn(Optional.of(producto));
        when(loteProductoRepository.sumContableByProducto(20)).thenReturn(0L);
        when(compraInsumoRepository.save(any())).thenAnswer(invocation -> {
            CompraInsumo compra = invocation.getArgument(0);
            compra.setIdCompra(99);
            return compra;
        });
        when(detalleCompraInsumoRepository.save(any())).thenAnswer(invocation -> {
            DetalleCompraInsumo det = invocation.getArgument(0);
            det.setIdDetalleCompra(55);
            return det;
        });
        when(loteProductoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(movimientoInventarioRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(detalleCompraInsumoRepository.findByCompraIdCompra(99)).thenReturn(List.of());
        when(compraMapper.toResponse(any(), any())).thenReturn(new CompraResponse());
    }

    private Empleado empleadoBase() {
        Empleado empleado = new Empleado();
        empleado.setIdEmpleado(2);
        return empleado;
    }

    @Test
    void registrarCompraCreaLoteProductoVigenteConEstadoDisponible() {
        CompraRequest request = new CompraRequest();
        request.setIdProveedor(1);

        DetalleCompraRequest detalle = new DetalleCompraRequest();
        detalle.setIdProducto(20);
        detalle.setNumeroLote("LOT-PROD-DISP");
        detalle.setCantidad(new BigDecimal("5"));
        detalle.setPrecioUnitario(new BigDecimal("4.00"));
        detalle.setFechaVencimiento(LocalDate.now().plusDays(1));
        request.setDetalles(List.of(detalle));

        prepararCompraProductoBase(request, detalle);

        compraService.registrarCompra(request, empleadoBase());

        ArgumentCaptor<LoteProducto> loteCaptor = ArgumentCaptor.forClass(LoteProducto.class);
        verify(loteProductoRepository).save(loteCaptor.capture());
        assertEquals(LoteProducto.Estado.DISPONIBLE, loteCaptor.getValue().getEstado());
    }

    @Test
    void calcularEstadoLoteInsumoCantidadCeroDevuelveAgotado() throws Exception {
        Method m = CompraService.class.getDeclaredMethod("calcularEstadoLote", BigDecimal.class, LocalDate.class);
        m.setAccessible(true);
        LoteInsumo.Estado estado = (LoteInsumo.Estado) m.invoke(compraService, BigDecimal.ZERO, LocalDate.now().plusDays(1));
        assertEquals(LoteInsumo.Estado.AGOTADO, estado);
    }

    @Test
    void calcularEstadoLoteProductoCantidadCeroDevuelveAgotado() throws Exception {
        Method m = CompraService.class.getDeclaredMethod("calcularEstadoLote", Integer.class, LocalDate.class);
        m.setAccessible(true);
        LoteProducto.Estado estado = (LoteProducto.Estado) m.invoke(compraService, 0, LocalDate.now().plusDays(1));
        assertEquals(LoteProducto.Estado.AGOTADO, estado);
    }
}
