package com.restaurante.service;

import com.restaurante.entity.*;
import com.restaurante.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class VentaService {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private InventarioProductoRepository inventarioProductoRepository;

    @Autowired
    private RecetaProductoRepository recetaProductoRepository;

    @Autowired
    private ComboDetalleRepository comboDetalleRepository;

    @Autowired
    private ConsumoInsumoVentaRepository consumoInsumoVentaRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private CajaService cajaService;

    @Autowired
    private PedidoRepository pedidoRepository;

    public Venta registrarVenta(Venta venta, List<DetalleVenta> detalles, List<VentaPago> pagos) {
        // 1. Verificar sesión de Caja abierta para el empleado
        Caja caja = cajaService.obtenerCajaAbiertaParaEmpleado(venta.getEmpleado())
                .orElseThrow(() -> new IllegalStateException(
                        "El empleado debe tener una caja abierta para realizar una venta."));

        // [NUEVO] Asignamos la caja activa a la venta para mantener la integridad en la
        // BD
        venta.setCaja(caja);

        // 2. Validaciones de negocio y restricciones Check
        BigDecimal totalCalculado = BigDecimal.ZERO;
        for (DetalleVenta det : detalles) {
            if (det.getCantidad() <= 0) {
                throw new IllegalArgumentException("La cantidad de venta debe ser mayor a 0.");
            }
            if (det.getProducto() != null && det.getCombo() != null) {
                throw new IllegalArgumentException(
                        "Un detalle de venta no puede pertenecer a un producto y a un combo simultáneamente.");
            }
            if (det.getProducto() == null && det.getCombo() == null) {
                throw new IllegalArgumentException("Un detalle de venta debe pertenecer a un producto o a un combo.");
            }

            BigDecimal unitPrice = det.getPrecioUnitario();
            if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("El precio unitario no puede ser negativo o nulo.");
            }

            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(det.getCantidad()));
            det.setSubtotal(subtotal);
            totalCalculado = totalCalculado.add(subtotal);
        }

        // Asignación de totales basados en fórmulas contables
        venta.setTotal(totalCalculado);

        BigDecimal cienMasIgv = BigDecimal.valueOf(100).add(venta.getIgvPorcentaje());
        BigDecimal subtotalGravado = totalCalculado.multiply(BigDecimal.valueOf(100))
                .divide(cienMasIgv, 4, RoundingMode.HALF_UP);
        BigDecimal igv = totalCalculado.subtract(subtotalGravado).setScale(4, RoundingMode.HALF_UP);

        venta.setSubtotal(subtotalGravado.setScale(2, RoundingMode.HALF_UP));
        venta.setSubtotalGravado(subtotalGravado.setScale(2, RoundingMode.HALF_UP));
        venta.setIgv(igv.setScale(2, RoundingMode.HALF_UP));
        venta.setEstado(Venta.Estado.PENDIENTE);

        // Persistencia inicial de la venta (created_at se autogenera aquí)
        Venta ventaGuardada = ventaRepository.save(venta);

        for (DetalleVenta det : detalles) {
            det.setVenta(ventaGuardada);

            // Cálculo del costo unitario real
            BigDecimal costoUnitario = calcularCostoUnitario(det);
            det.setCostoUnitario(costoUnitario);

            detalleVentaRepository.save(det);
        }

        return ventaGuardada;
    }

    public Venta pagarVenta(Integer idVenta, List<VentaPago> pagos) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada."));

        if (venta.getEstado() != Venta.Estado.PENDIENTE) {
            throw new IllegalStateException("La venta no está en estado PENDIENTE.");
        }

        // [OPTIMIZADO] Ya no consultamos a cajaService, usamos la relación directa
        // mapeada de la venta
        Caja caja = venta.getCaja();
        if (caja == null || caja.getEstado() != Caja.Estado.ABIERTA) {
            throw new IllegalStateException("La caja asociada a esta venta ya no se encuentra abierta.");
        }

        BigDecimal totalPagos = BigDecimal.ZERO;
        for (VentaPago pago : pagos) {
            totalPagos = totalPagos.add(pago.getMonto());
        }

        if (totalPagos.compareTo(venta.getTotal()) < 0) {
            throw new IllegalArgumentException(
                    "El monto pagado es insuficiente. Total: " + venta.getTotal() + ", Pagado: " + totalPagos);
        }

        // 1. Deducción física de Stock en Inventarios
        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaIdVenta(venta.getIdVenta());
        for (DetalleVenta det : detalles) {
            descontarStockInventario(det, venta.getEmpleado());
        }

        // 2. Registro de movimientos de flujo de caja para pagos en Efectivo
        for (VentaPago pago : pagos) {
            if (pago.getMetodoPago() != null && pago.getMetodoPago().getNombre().equalsIgnoreCase("Efectivo")) {
                cajaService.registrarMovimiento(
                        caja.getIdCaja(),
                        MovimientoCaja.Tipo.INGRESO,
                        "Venta de productos - Comprobante: " + venta.getCodigoVenta(),
                        pago.getMonto());
            }
        }

        venta.setEstado(Venta.Estado.PAGADA);

        // Sincronización del estado del pedido vinculado si existe
        if (venta.getPedido() != null) {
            Pedido pedido = venta.getPedido();
            pedido.setEstado(Pedido.Estado.ENTREGADO);
            pedidoRepository.save(pedido);
        }

        return ventaRepository.save(venta);
    }

    public Venta anularVenta(Integer idVenta, String motivo, Empleado empleadoAnulacion) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada."));

        if (venta.getEstado() == Venta.Estado.ANULADA) {
            throw new IllegalStateException("La venta ya está anulada.");
        }

        // 1. Reversión completa de stock al inventario
        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaIdVenta(venta.getIdVenta());
        for (DetalleVenta det : detalles) {
            revertirDescuentoStock(det, empleadoAnulacion);
        }

        // 2. Registro de contramovimiento (EGRESO) en la caja si ya estaba pagada
        if (venta.getEstado() == Venta.Estado.PAGADA) {
            // [OPTIMIZADO] Obtenemos la caja real con la que se operó el registro original
            Caja caja = venta.getCaja();
            if (caja != null) {
                cajaService.registrarMovimiento(
                        caja.getIdCaja(),
                        MovimientoCaja.Tipo.EGRESO,
                        "ANULACIÓN de venta: " + venta.getCodigoVenta(),
                        venta.getTotal());
            }
        }

        venta.setEstado(Venta.Estado.ANULADA);
        venta.setFechaAnulacion(LocalDateTime.now());
        venta.setMotivoAnulacion(motivo);
        venta.setEmpleadoAnulacion(empleadoAnulacion);

        if (venta.getPedido() != null) {
            Pedido pedido = venta.getPedido();
            pedido.setEstado(Pedido.Estado.CANCELADO);
            pedidoRepository.save(pedido);
        }

        return ventaRepository.save(venta);
    }

    private BigDecimal calcularCostoUnitario(DetalleVenta det) {
        BigDecimal costo = BigDecimal.ZERO;
        if (det.getProducto() != null) {
            Producto prod = det.getProducto();
            if (prod.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
                return inventarioProductoRepository.findByProductoIdProducto(prod.getIdProducto())
                        .map(inv -> inv.getProducto().getPrecio().multiply(new BigDecimal("0.40")))
                        .orElse(BigDecimal.ZERO);
            } else {
                List<RecetaProducto> receta = recetaProductoRepository.findByProductoIdProducto(prod.getIdProducto());
                for (RecetaProducto item : receta) {
                    costo = costo.add(item.getCantidad().multiply(item.getInsumo().getCostoPromedio()));
                }
            }
        } else if (det.getCombo() != null) {
            List<ComboDetalle> comboItems = comboDetalleRepository.findByComboIdCombo(det.getCombo().getIdCombo());
            for (ComboDetalle item : comboItems) {
                BigDecimal prodCost = BigDecimal.ZERO;
                if (item.getProducto().getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
                    prodCost = item.getProducto().getPrecio().multiply(new BigDecimal("0.40"));
                } else {
                    List<RecetaProducto> receta = recetaProductoRepository
                            .findByProductoIdProducto(item.getProducto().getIdProducto());
                    for (RecetaProducto rItem : receta) {
                        prodCost = prodCost.add(rItem.getCantidad().multiply(rItem.getInsumo().getCostoPromedio()));
                    }
                }
                costo = costo.add(prodCost.multiply(BigDecimal.valueOf(item.getCantidad())));
            }
        }
        return costo;
    }

    private void descontarStockInventario(DetalleVenta det, Empleado empleado) {
        int cantidadTotal = det.getCantidad();
        if (det.getProducto() != null) {
            descontarProducto(det.getProducto(), cantidadTotal, det.getVenta(), empleado);
        } else if (det.getCombo() != null) {
            List<ComboDetalle> comboItems = comboDetalleRepository.findByComboIdCombo(det.getCombo().getIdCombo());
            for (ComboDetalle item : comboItems) {
                descontarProducto(item.getProducto(), item.getCantidad() * cantidadTotal, det.getVenta(), empleado);
            }
        }
    }

    private void descontarProducto(Producto prod, int cantidad, Venta venta, Empleado empleado) {
        if (prod.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
            InventarioProducto inv = inventarioProductoRepository.findByProductoIdProducto(prod.getIdProducto())
                    .orElseThrow(
                            () -> new IllegalStateException("Inventario no configurado para: " + prod.getNombre()));

            if (inv.getStock() < cantidad) {
                throw new IllegalStateException("Stock insuficiente para el producto directo: " + prod.getNombre()
                        + ". Disponible: " + inv.getStock());
            }

            inv.setStock(inv.getStock() - cantidad);
            inventarioProductoRepository.save(inv);

            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoRecurso(MovimientoInventario.TipoRecurso.PRODUCTO);
            mov.setProducto(prod);
            mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.CONSUMO);
            mov.setOrigen(MovimientoInventario.Origen.VENTA);
            mov.setReferenciaId(venta.getIdVenta());
            mov.setCantidad(BigDecimal.valueOf(cantidad));
            mov.setMotivo("Venta directa de producto");
            mov.setEmpleado(empleado);
            movimientoInventarioRepository.save(mov);

        } else {
            List<RecetaProducto> receta = recetaProductoRepository.findByProductoIdProducto(prod.getIdProducto());
            if (receta.isEmpty()) {
                throw new IllegalStateException("El producto preparado no tiene receta definida: " + prod.getNombre());
            }

            for (RecetaProducto item : receta) {
                Insumo insumo = item.getInsumo();
                BigDecimal cantidadNecesaria = item.getCantidad().multiply(BigDecimal.valueOf(cantidad));

                if (insumo.getStock().compareTo(cantidadNecesaria) < 0) {
                    throw new IllegalStateException("Stock insuficiente para el insumo: " + insumo.getNombre()
                            + " en la receta de: " + prod.getNombre() + ". Disponible: " + insumo.getStock());
                }

                insumo.setStock(insumo.getStock().subtract(cantidadNecesaria));
                insumoRepository.save(insumo);

                ConsumoInsumoVenta consumo = new ConsumoInsumoVenta();
                consumo.setVenta(venta);
                consumo.setInsumo(insumo);
                consumo.setCantidad(cantidadNecesaria);
                consumo.setCostoUnitario(insumo.getCostoPromedio());
                consumoInsumoVentaRepository.save(consumo);

                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
                mov.setInsumo(insumo);
                mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.CONSUMO);
                mov.setOrigen(MovimientoInventario.Origen.VENTA);
                mov.setReferenciaId(venta.getIdVenta());
                mov.setCantidad(cantidadNecesaria);
                mov.setMotivo("Consumo en venta de " + prod.getNombre());
                mov.setEmpleado(empleado);
                movimientoInventarioRepository.save(mov);
            }
        }
    }

    private void revertirDescuentoStock(DetalleVenta det, Empleado empleado) {
        int cantidadTotal = det.getCantidad();
        if (det.getProducto() != null) {
            revertirProducto(det.getProducto(), cantidadTotal, det.getVenta().getIdVenta(), empleado);
        } else if (det.getCombo() != null) {
            List<ComboDetalle> comboItems = comboDetalleRepository.findByComboIdCombo(det.getCombo().getIdCombo());
            for (ComboDetalle item : comboItems) {
                revertirProducto(item.getProducto(), item.getCantidad() * cantidadTotal, det.getVenta().getIdVenta(),
                        empleado);
            }
        }
    }

    private void revertirProducto(Producto prod, int cantidad, Integer ventaId, Empleado empleado) {
        if (prod.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
            InventarioProducto inv = inventarioProductoRepository.findByProductoIdProducto(prod.getIdProducto())
                    .orElse(null);
            if (inv != null) {
                inv.setStock(inv.getStock() + cantidad);
                inventarioProductoRepository.save(inv);

                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoRecurso(MovimientoInventario.TipoRecurso.PRODUCTO);
                mov.setProducto(prod);
                mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.DEVOLUCION);
                mov.setOrigen(MovimientoInventario.Origen.ANULACION);
                mov.setReferenciaId(ventaId);
                mov.setCantidad(BigDecimal.valueOf(cantidad));
                mov.setMotivo("Reversión por anulación de venta");
                mov.setEmpleado(empleado);
                movimientoInventarioRepository.save(mov);
            }
        } else {
            List<RecetaProducto> receta = recetaProductoRepository.findByProductoIdProducto(prod.getIdProducto());
            for (RecetaProducto item : receta) {
                Insumo insumo = item.getInsumo();
                BigDecimal cantidadNecesaria = item.getCantidad().multiply(BigDecimal.valueOf(cantidad));

                insumo.setStock(insumo.getStock().add(cantidadNecesaria));
                insumoRepository.save(insumo);

                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
                mov.setInsumo(insumo);
                mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.DEVOLUCION);
                mov.setOrigen(MovimientoInventario.Origen.ANULACION);
                mov.setReferenciaId(ventaId);
                mov.setCantidad(cantidadNecesaria);
                mov.setMotivo("Reversión por anulación de venta de " + prod.getNombre());
                mov.setEmpleado(empleado);
                movimientoInventarioRepository.save(mov);
            }
        }
    }
}