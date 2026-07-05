package com.restaurante.service;

import com.restaurante.dto.CompraRequest;
import com.restaurante.dto.DetalleCompraRequest;
import com.restaurante.dto.response.CompraResponse;
import com.restaurante.dto.mapper.CompraMapper;
import com.restaurante.entity.*;
import com.restaurante.repository.*;
import com.restaurante.service.policy.ProductoPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompraService {

    @Autowired
    private CompraInsumoRepository compraInsumoRepository;

    @Autowired
    private DetalleCompraInsumoRepository detalleCompraInsumoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private LoteInsumoRepository loteInsumoRepository;

    @Autowired
    private LoteProductoRepository loteProductoRepository;

    @Autowired
    private CompraMapper compraMapper;

    @Autowired
    private ProductoPolicy productoPolicy;

    public CompraResponse registrarCompra(CompraRequest request, Empleado empleado) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La compra debe tener al menos un detalle.");
        }

        Proveedor proveedor = proveedorRepository.findById(request.getIdProveedor())
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado con ID: " + request.getIdProveedor()));

        CompraInsumo compra = new CompraInsumo();
        compra.setCodigoCompra(normalizarDocumentoCompra(request.getCodigoCompra()));
        compra.setProveedor(proveedor);
        compra.setEmpleado(empleado);
        compra.setObservacion(request.getObservacion());

        BigDecimal totalCalculado = BigDecimal.ZERO;
        List<DetalleCompraInsumo> detalles = new ArrayList<>();

        for (DetalleCompraRequest detReq : request.getDetalles()) {
            if (detReq.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("La cantidad del insumo debe ser mayor a 0.");
            }
            if (detReq.getPrecioUnitario().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("El precio unitario no puede ser negativo.");
            }

            validarDetalleCompraRecurso(detReq);

            BigDecimal subtotal = detReq.getPrecioUnitario().multiply(detReq.getCantidad());

            DetalleCompraInsumo det = new DetalleCompraInsumo();
            if (detReq.getIdInsumo() != null) {
                Insumo insumo = insumoRepository.findById(detReq.getIdInsumo())
                        .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado con ID: " + detReq.getIdInsumo()));
                det.setInsumo(insumo);
            } else {
                Producto producto = productoRepository.findById(detReq.getIdProducto())
                        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + detReq.getIdProducto()));
                validarProductoComprable(producto);
                det.setProducto(producto);
            }
            det.setCantidad(detReq.getCantidad());
            det.setPrecioUnitario(detReq.getPrecioUnitario());
            det.setSubtotal(subtotal);
            det.setNumeroLote(normalizarNumeroLote(detReq, detalles.size() + 1));
            det.setFechaVencimiento(detReq.getFechaVencimiento());

            detalles.add(det);
            totalCalculado = totalCalculado.add(subtotal);
        }

        // Calculate subtotal and IGV using default (18.00%)
        BigDecimal igvPorcentaje = new BigDecimal("18.00");
        BigDecimal cienMasIgv = BigDecimal.valueOf(100).add(igvPorcentaje);
        BigDecimal subtotalGravado = totalCalculado.multiply(BigDecimal.valueOf(100))
                .divide(cienMasIgv, 4, RoundingMode.HALF_UP);
        BigDecimal igv = totalCalculado.subtract(subtotalGravado).setScale(4, RoundingMode.HALF_UP);

        compra.setSubtotal(subtotalGravado.setScale(2, RoundingMode.HALF_UP));
        compra.setIgv(igv.setScale(2, RoundingMode.HALF_UP));
        compra.setTotal(totalCalculado.setScale(2, RoundingMode.HALF_UP));
        compra.setEstado(CompraInsumo.Estado.REGISTRADA);

        CompraInsumo compraGuardada = compraInsumoRepository.save(compra);

        for (DetalleCompraInsumo det : detalles) {
            det.setCompra(compraGuardada);
            if (det.getInsumo() == null) {
                registrarDetalleProducto(compraGuardada, det);
                continue;
            }

            // Recalculate weighted average cost (Costo Promedio Ponderado)
            Insumo insumo = det.getInsumo();
            BigDecimal stockActual = loteInsumoRepository.sumContableByInsumo(insumo.getIdInsumo());
            BigDecimal costoPromedioActual = insumo.getCostoPromedio();
            if (costoPromedioActual == null) {
                costoPromedioActual = BigDecimal.ZERO;
            }

            BigDecimal stockNuevo = stockActual.add(det.getCantidad());

            BigDecimal nuevoCostoPromedio;
            if (stockNuevo.compareTo(BigDecimal.ZERO) == 0) {
                nuevoCostoPromedio = BigDecimal.ZERO;
            } else {
                BigDecimal valorActual = stockActual.multiply(costoPromedioActual);
                BigDecimal valorNuevaCompra = det.getCantidad().multiply(det.getPrecioUnitario());
                nuevoCostoPromedio = valorActual.add(valorNuevaCompra).divide(stockNuevo, 4, RoundingMode.HALF_UP);
            }

            insumo.setCostoPromedio(nuevoCostoPromedio.setScale(2, RoundingMode.HALF_UP));
            insumoRepository.save(insumo);

            DetalleCompraInsumo detalleGuardado = detalleCompraInsumoRepository.save(det);

            LoteInsumo lote = new LoteInsumo();
            lote.setInsumo(insumo);
            lote.setDetalleCompra(detalleGuardado);
            lote.setNumeroLote(detalleGuardado.getNumeroLote());
            lote.setCantidadInicial(det.getCantidad());
            lote.setCantidadDisponible(det.getCantidad());
            lote.setCostoUnitario(det.getPrecioUnitario());
            lote.setFechaVencimiento(det.getFechaVencimiento());
            lote.setEstado(calcularEstadoLote(det.getCantidad(), det.getFechaVencimiento()));
            LoteInsumo loteGuardado = loteInsumoRepository.save(lote);

            // Register inventory entry movement
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
            mov.setInsumo(insumo);
            mov.setLoteInsumo(loteGuardado);
            mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.ENTRADA_COMPRA);
            mov.setReferenceType("COMPRA");
            mov.setReferenceId(compraGuardada.getIdCompra());
            mov.setCantidad(det.getCantidad());
            aplicarSnapshotEntrada(mov, stockActual, det.getCantidad(), det.getPrecioUnitario());
            mov.setMotivo("Compra de insumo - Código: " + compraGuardada.getCodigoCompra());
            mov.setEmpleado(compraGuardada.getEmpleado());
            movimientoInventarioRepository.save(mov);
        }

        return mapToDetailedResponse(compraGuardada);
    }

    public CompraResponse anularCompra(Integer idCompra, Empleado empleadoAnulacion) {
        CompraInsumo compra = compraInsumoRepository.findById(idCompra)
                .orElseThrow(() -> new IllegalArgumentException("Compra no encontrada."));

        if (compra.getEstado() == CompraInsumo.Estado.ANULADA) {
            throw new IllegalStateException("La compra ya se encuentra anulada.");
        }

        List<DetalleCompraInsumo> detalles = detalleCompraInsumoRepository.findByCompraIdCompra(compra.getIdCompra());

        for (DetalleCompraInsumo det : detalles) {
            if (det.getProducto() != null) {
                anularDetalleProducto(compra, det, empleadoAnulacion);
                continue;
            }

            Insumo insumo = insumoRepository.findById(det.getInsumo().getIdInsumo())
                    .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado."));

            BigDecimal stockActual = loteInsumoRepository.sumContableByInsumo(insumo.getIdInsumo());
            // Validate if we have enough stock to revert
            if (stockActual.compareTo(det.getCantidad()) < 0) {
                throw new IllegalStateException("No se puede anular la compra. El stock actual de " + insumo.getNombre() + " (" + stockActual + ") es menor que la cantidad comprada (" + det.getCantidad() + ").");
            }

            BigDecimal stockNuevo = stockActual.subtract(det.getCantidad());
            
            // Recalculating the average cost when annulling
            BigDecimal costoPromedioActual = insumo.getCostoPromedio();
            if (costoPromedioActual == null) {
                costoPromedioActual = BigDecimal.ZERO;
            }

            BigDecimal nuevoCostoPromedio;
            if (stockNuevo.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal valorActual = stockActual.multiply(costoPromedioActual);
                BigDecimal valorCompra = det.getCantidad().multiply(det.getPrecioUnitario());
                BigDecimal valorRestante = valorActual.subtract(valorCompra);
                if (valorRestante.compareTo(BigDecimal.ZERO) < 0) {
                    valorRestante = BigDecimal.ZERO;
                }
                nuevoCostoPromedio = valorRestante.divide(stockNuevo, 4, RoundingMode.HALF_UP);
            } else {
                nuevoCostoPromedio = BigDecimal.ZERO;
            }

            insumo.setCostoPromedio(nuevoCostoPromedio.setScale(2, RoundingMode.HALF_UP));
            insumoRepository.save(insumo);

            List<LoteInsumo> lotes = loteInsumoRepository.findByDetalleCompraIdDetalleCompra(det.getIdDetalleCompra());
            if (!lotes.isEmpty()) {
                BigDecimal disponibleLotes = lotes.stream()
                        .map(LoteInsumo::getCantidadDisponible)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (disponibleLotes.compareTo(det.getCantidad()) < 0) {
                    throw new IllegalStateException("No se puede anular la compra. Ya se consumió stock del lote de "
                            + insumo.getNombre() + ".");
                }
                for (LoteInsumo lote : lotes) {
                    lote.setCantidadDisponible(BigDecimal.ZERO);
                    lote.setEstado(LoteInsumo.Estado.AGOTADO);
                    loteInsumoRepository.save(lote);
                }
            }

            // Register inventory movement for annulment (SALIDA)
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
            mov.setInsumo(insumo);
            lotes.stream().findFirst().ifPresent(mov::setLoteInsumo);
            mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.DEVOLUCION);
            mov.setReferenceType("ANULACION_COMPRA");
            mov.setReferenceId(compra.getIdCompra());
            mov.setCantidad(det.getCantidad());
            aplicarSnapshotSalida(mov, stockActual, det.getCantidad(), det.getPrecioUnitario());
            mov.setMotivo("Anulación de compra - Código: " + compra.getCodigoCompra());
            mov.setEmpleado(empleadoAnulacion);
            movimientoInventarioRepository.save(mov);
        }

        compra.setEstado(CompraInsumo.Estado.ANULADA);
        CompraInsumo compraAnulada = compraInsumoRepository.save(compra);
        return mapToDetailedResponse(compraAnulada);
    }

    @Transactional(readOnly = true)
    public Optional<CompraResponse> obtenerCompraPorId(Integer id) {
        return compraInsumoRepository.findById(id).map(this::mapToDetailedResponse);
    }

    @Transactional(readOnly = true)
    public List<CompraResponse> listarCompras() {
        return compraInsumoRepository.findAll().stream()
                .map(this::mapToDetailedResponse)
                .collect(Collectors.toList());
    }

    private CompraResponse mapToDetailedResponse(CompraInsumo compra) {
        List<DetalleCompraInsumo> detalles = detalleCompraInsumoRepository.findByCompraIdCompra(compra.getIdCompra());
        return compraMapper.toResponse(compra, detalles);
    }

    private void validarDetalleCompraRecurso(DetalleCompraRequest detReq) {
        boolean tieneInsumo = detReq.getIdInsumo() != null;
        boolean tieneProducto = detReq.getIdProducto() != null;
        if (tieneInsumo == tieneProducto) {
            throw new IllegalArgumentException("Cada detalle de compra debe indicar un insumo o un SKU producto, pero no ambos.");
        }
    }

    private String normalizarDocumentoCompra(String codigoCompra) {
        if (codigoCompra != null && !codigoCompra.isBlank()) {
            return codigoCompra.trim().toUpperCase();
        }
        return "COMP-" + System.currentTimeMillis();
    }

    private String normalizarNumeroLote(DetalleCompraRequest detReq, int ordinal) {
        if (detReq.getNumeroLote() != null && !detReq.getNumeroLote().isBlank()) {
            return detReq.getNumeroLote().trim().toUpperCase();
        }
        String recurso = detReq.getIdProducto() != null ? "P" + detReq.getIdProducto() : "I" + detReq.getIdInsumo();
        return "LOT-" + recurso + "-" + System.currentTimeMillis() + "-" + ordinal;
    }

    private void validarProductoComprable(Producto producto) {
        productoPolicy.validarComprable(producto);
    }

    private void registrarDetalleProducto(CompraInsumo compraGuardada, DetalleCompraInsumo det) {
        Producto producto = det.getProducto();
        int cantidad = toWholeUnits(det.getCantidad());
        BigDecimal stockActual = BigDecimal.valueOf(loteProductoRepository.sumContableByProducto(producto.getIdProducto()));

        DetalleCompraInsumo detalleGuardado = detalleCompraInsumoRepository.save(det);

        LoteProducto lote = new LoteProducto();
        lote.setProducto(producto);
        lote.setDetalleCompra(detalleGuardado);
        lote.setNumeroLote(detalleGuardado.getNumeroLote());
        lote.setCantidadInicial(cantidad);
        lote.setCantidadDisponible(cantidad);
        lote.setCostoUnitario(det.getPrecioUnitario());
        lote.setFechaVencimiento(det.getFechaVencimiento());
        lote.setEstado(calcularEstadoLote(cantidad, det.getFechaVencimiento()));
        LoteProducto loteGuardado = loteProductoRepository.save(lote);

        MovimientoInventario mov = new MovimientoInventario();
        mov.setTipoRecurso(MovimientoInventario.TipoRecurso.PRODUCTO);
        mov.setProducto(producto);
        mov.setLoteProducto(loteGuardado);
        mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.ENTRADA_COMPRA);
        mov.setReferenceType("COMPRA");
        mov.setReferenceId(compraGuardada.getIdCompra());
        mov.setCantidad(BigDecimal.valueOf(cantidad));
        aplicarSnapshotEntrada(mov, stockActual, BigDecimal.valueOf(cantidad), det.getPrecioUnitario());
        mov.setMotivo("Compra de SKU producto - Código: " + compraGuardada.getCodigoCompra());
        mov.setEmpleado(compraGuardada.getEmpleado());
        movimientoInventarioRepository.save(mov);
    }

    private void anularDetalleProducto(CompraInsumo compra, DetalleCompraInsumo det, Empleado empleadoAnulacion) {
        Producto producto = productoRepository.findById(det.getProducto().getIdProducto())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado."));
        int cantidad = toWholeUnits(det.getCantidad());

        List<LoteProducto> lotes = loteProductoRepository.findByDetalleCompraIdDetalleCompra(det.getIdDetalleCompra());
        int disponibleLotes = lotes.stream()
                .mapToInt(lote -> lote.getCantidadDisponible() != null ? lote.getCantidadDisponible() : 0)
                .sum();
        BigDecimal stockActual = BigDecimal.valueOf(loteProductoRepository.sumContableByProducto(producto.getIdProducto()));
        if (disponibleLotes < cantidad) {
            throw new IllegalStateException("No se puede anular la compra. Ya se consumió stock del lote de "
                    + producto.getNombre() + ".");
        }

        for (LoteProducto lote : lotes) {
            lote.setCantidadDisponible(0);
            lote.setEstado(LoteProducto.Estado.AGOTADO);
            loteProductoRepository.save(lote);
        }

        MovimientoInventario mov = new MovimientoInventario();
        mov.setTipoRecurso(MovimientoInventario.TipoRecurso.PRODUCTO);
        mov.setProducto(producto);
        lotes.stream().findFirst().ifPresent(mov::setLoteProducto);
        mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.DEVOLUCION);
        mov.setReferenceType("ANULACION_COMPRA");
        mov.setReferenceId(compra.getIdCompra());
        mov.setCantidad(BigDecimal.valueOf(cantidad));
        aplicarSnapshotSalida(mov, stockActual, BigDecimal.valueOf(cantidad), det.getPrecioUnitario());
        mov.setMotivo("Anulación de compra SKU - Código: " + compra.getCodigoCompra());
        mov.setEmpleado(empleadoAnulacion);
        movimientoInventarioRepository.save(mov);
    }

    private int toWholeUnits(BigDecimal cantidad) {
        try {
            return cantidad.toBigIntegerExact().intValueExact();
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException("La cantidad de producto debe ser un número entero.");
        }
    }

    private LoteInsumo.Estado calcularEstadoLote(BigDecimal cantidadDisponible, LocalDate fechaVencimiento) {
        if (cantidadDisponible == null || cantidadDisponible.compareTo(BigDecimal.ZERO) <= 0) {
            return LoteInsumo.Estado.AGOTADO;
        }
        if (fechaVencimiento != null && fechaVencimiento.isBefore(LocalDate.now())) {
            return LoteInsumo.Estado.VENCIDO;
        }
        return LoteInsumo.Estado.DISPONIBLE;
    }

    private LoteProducto.Estado calcularEstadoLote(Integer cantidadDisponible, LocalDate fechaVencimiento) {
        if (cantidadDisponible == null || cantidadDisponible <= 0) {
            return LoteProducto.Estado.AGOTADO;
        }
        if (fechaVencimiento != null && fechaVencimiento.isBefore(LocalDate.now())) {
            return LoteProducto.Estado.VENCIDO;
        }
        return LoteProducto.Estado.DISPONIBLE;
    }

    private void aplicarSnapshotEntrada(MovimientoInventario movimiento, BigDecimal stockAnterior,
            BigDecimal cantidad, BigDecimal costoUnitario) {
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockNuevo(stockAnterior.add(cantidad));
        movimiento.setCostoUnitario(costoUnitario);
        movimiento.setSaldoValorizado(calcularSaldoValorizado(movimiento.getStockNuevo(), costoUnitario));
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
