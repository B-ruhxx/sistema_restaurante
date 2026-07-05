package com.restaurante.service;

import com.restaurante.dto.mapper.MovimientoInventarioMapper;
import com.restaurante.dto.request.AjusteInventarioRequest;
import com.restaurante.dto.response.AjusteInventarioResponse;
import com.restaurante.dto.response.MovimientoInventarioResponse;
import com.restaurante.entity.AjusteInventario;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Insumo;
import com.restaurante.entity.MovimientoInventario;
import com.restaurante.entity.Producto;
import com.restaurante.repository.AjusteInventarioRepository;
import com.restaurante.repository.InsumoRepository;
import com.restaurante.repository.LoteProductoRepository;
import com.restaurante.repository.MovimientoInventarioRepository;
import com.restaurante.repository.ProductoRepository;
import com.restaurante.service.policy.InventarioPolicy;
import com.restaurante.service.policy.ProductoPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MovimientoInventarioService {
    private static final String REF_AJUSTE_INVENTARIO = "AJUSTE_INVENTARIO";

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private AjusteInventarioRepository ajusteInventarioRepository;

    @Autowired
    private MovimientoInventarioMapper movimientoInventarioMapper;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private LoteProductoRepository loteProductoRepository;

    @Autowired
    private LoteInsumoService loteInsumoService;

    @Autowired
    private LoteProductoService loteProductoService;

    @Autowired
    private ProductoPolicy productoPolicy;

    @Autowired
    private InventarioPolicy inventarioPolicy;

    public List<MovimientoInventarioResponse> getAllMovimientos() {
        return movimientoInventarioRepository.findAll().stream()
                .map(movimientoInventarioMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<MovimientoInventarioResponse> getMovimientosByInsumo(Integer idInsumo) {
        return movimientoInventarioRepository.findByInsumoIdInsumo(idInsumo).stream()
                .map(movimientoInventarioMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<MovimientoInventarioResponse> getMovimientosByProducto(Integer idProducto) {
        return movimientoInventarioRepository.findByProductoIdProducto(idProducto).stream()
                .map(movimientoInventarioMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AjusteInventarioResponse registrarAjusteSalida(AjusteInventarioRequest request, Empleado empleado) {
        inventarioPolicy.validarAjusteManual(request.getCantidad(), request.getMotivo(), empleado);
        MovimientoInventario.TipoRecurso tipoRecurso = inventarioPolicy.parseTipoRecurso(request.getTipoRecurso());

        if (tipoRecurso == MovimientoInventario.TipoRecurso.INSUMO) {
            return registrarAjusteSalidaInsumo(request, empleado);
        }

        return registrarAjusteSalidaProducto(request, empleado);
    }

    private AjusteInventarioResponse registrarAjusteSalidaInsumo(AjusteInventarioRequest request, Empleado empleado) {
        if (request.getIdInsumo() == null) {
            throw new IllegalArgumentException("El insumo es obligatorio para ajustar stock de insumos.");
        }

        Insumo insumo = insumoRepository.findById(request.getIdInsumo())
                .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado."));
        BigDecimal stockActual = insumo.getStock() != null ? insumo.getStock() : BigDecimal.ZERO;
        inventarioPolicy.validarStockSuficiente(insumo, request.getCantidad());

        List<LoteInsumoService.DescuentoLote> descuentos = loteInsumoService.descontarFifo(insumo, request.getCantidad());
        insumo.setStock(stockActual.subtract(request.getCantidad()));
        insumoRepository.save(insumo);

        AjusteInventario ajuste = crearCabeceraAjuste(
                MovimientoInventario.TipoRecurso.INSUMO, insumo, null, request, empleado);
        List<MovimientoInventario> movimientos = new java.util.ArrayList<>();
        BigDecimal stockCursor = stockActual;
        for (LoteInsumoService.DescuentoLote descuento : descuentos) {
            MovimientoInventario movimiento = new MovimientoInventario();
            movimiento.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
            movimiento.setInsumo(insumo);
            movimiento.setLoteInsumo(descuento.lote());
            movimiento.setTipoMovimiento(MovimientoInventario.TipoMovimiento.SALIDA_AJUSTE);
            movimiento.setReferenceType(REF_AJUSTE_INVENTARIO);
            movimiento.setReferenceId(ajuste.getIdAjuste());
            movimiento.setCantidad(descuento.cantidad());
            aplicarSnapshotSalida(movimiento, stockCursor, descuento.cantidad(), descuento.lote().getCostoUnitario());
            movimiento.setMotivo(ajuste.getMotivo());
            movimiento.setEmpleado(empleado);
            movimientos.add(movimientoInventarioRepository.save(movimiento));
            stockCursor = movimiento.getStockNuevo();
        }

        return toAjusteResponse(ajuste, movimientos);
    }

    private AjusteInventarioResponse registrarAjusteSalidaProducto(AjusteInventarioRequest request, Empleado empleado) {
        if (request.getIdProducto() == null) {
            throw new IllegalArgumentException("El producto es obligatorio para ajustar stock de productos.");
        }

        Producto producto = productoRepository.findById(request.getIdProducto())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado."));
        productoPolicy.validarAjustable(producto);

        int cantidad = toWholeUnits(request.getCantidad());
        BigDecimal stockActual = BigDecimal.valueOf(loteProductoRepository.sumDisponibleByProducto(producto.getIdProducto()));
        List<LoteProductoService.DescuentoLoteProducto> descuentos = loteProductoService.descontarFifo(producto, cantidad);

        AjusteInventario ajuste = crearCabeceraAjuste(
                MovimientoInventario.TipoRecurso.PRODUCTO, null, producto, request, empleado);
        List<MovimientoInventario> movimientos = new java.util.ArrayList<>();
        BigDecimal stockCursor = stockActual;
        for (LoteProductoService.DescuentoLoteProducto descuento : descuentos) {
            MovimientoInventario movimiento = new MovimientoInventario();
            movimiento.setTipoRecurso(MovimientoInventario.TipoRecurso.PRODUCTO);
            movimiento.setProducto(producto);
            movimiento.setLoteProducto(descuento.lote());
            movimiento.setTipoMovimiento(MovimientoInventario.TipoMovimiento.SALIDA_AJUSTE);
            movimiento.setReferenceType(REF_AJUSTE_INVENTARIO);
            movimiento.setReferenceId(ajuste.getIdAjuste());
            movimiento.setCantidad(BigDecimal.valueOf(descuento.cantidad()));
            aplicarSnapshotSalida(movimiento, stockCursor, BigDecimal.valueOf(descuento.cantidad()), descuento.lote().getCostoUnitario());
            movimiento.setMotivo(ajuste.getMotivo());
            movimiento.setEmpleado(empleado);
            movimientos.add(movimientoInventarioRepository.save(movimiento));
            stockCursor = movimiento.getStockNuevo();
        }

        return toAjusteResponse(ajuste, movimientos);
    }

    private AjusteInventario crearCabeceraAjuste(MovimientoInventario.TipoRecurso tipoRecurso,
            Insumo insumo, Producto producto, AjusteInventarioRequest request, Empleado empleado) {
        AjusteInventario ajuste = new AjusteInventario();
        ajuste.setTipoRecurso(tipoRecurso);
        ajuste.setInsumo(insumo);
        ajuste.setProducto(producto);
        ajuste.setCantidad(request.getCantidad());
        ajuste.setMotivo(request.getMotivo().trim());
        ajuste.setEmpleado(empleado);
        return ajusteInventarioRepository.save(ajuste);
    }

    private AjusteInventarioResponse toAjusteResponse(AjusteInventario ajuste, List<MovimientoInventario> movimientos) {
        AjusteInventarioResponse response = new AjusteInventarioResponse();
        response.setIdAjuste(ajuste.getIdAjuste());
        if (ajuste.getTipoRecurso() != null) {
            response.setTipoRecurso(ajuste.getTipoRecurso().name());
        }
        if (ajuste.getInsumo() != null) {
            response.setIdInsumo(ajuste.getInsumo().getIdInsumo());
            response.setNombreInsumo(ajuste.getInsumo().getNombre());
        }
        if (ajuste.getProducto() != null) {
            response.setIdProducto(ajuste.getProducto().getIdProducto());
            response.setNombreProducto(ajuste.getProducto().getNombre());
        }
        response.setCantidad(ajuste.getCantidad());
        response.setMotivo(ajuste.getMotivo());
        if (ajuste.getEstado() != null) {
            response.setEstado(ajuste.getEstado().name());
        }
        response.setFecha(ajuste.getFecha());
        if (ajuste.getEmpleado() != null) {
            response.setIdEmpleado(ajuste.getEmpleado().getIdEmpleado());
            response.setNombreEmpleado(ajuste.getEmpleado().getNombre() + " " + ajuste.getEmpleado().getApellido());
        }
        response.setMovimientos(movimientos.stream()
                .map(movimientoInventarioMapper::toResponse)
                .collect(Collectors.toList()));
        return response;
    }

    private int toWholeUnits(BigDecimal cantidad) {
        try {
            return cantidad.toBigIntegerExact().intValueExact();
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException("La cantidad de producto debe ser un número entero.");
        }
    }

    private void aplicarSnapshotSalida(MovimientoInventario movimiento, BigDecimal stockAnterior,
            BigDecimal cantidad, BigDecimal costoUnitario) {
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockNuevo(stockAnterior.subtract(cantidad));
        movimiento.setCostoUnitario(costoUnitario);
        movimiento.setSaldoValorizado(calcularSaldoValorizado(movimiento.getStockNuevo(), costoUnitario));
    }

    private BigDecimal calcularSaldoValorizado(BigDecimal stock, BigDecimal costoUnitario) {
        if (stock == null || costoUnitario == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return stock.multiply(costoUnitario).setScale(2, RoundingMode.HALF_UP);
    }
}
