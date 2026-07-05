package com.restaurante.service;

import com.restaurante.dto.VentaPagoRequest;
import com.restaurante.dto.VentaRequest;
import com.restaurante.dto.CobrarPedidoRequest;
import com.restaurante.dto.response.CajaResponse;
import com.restaurante.dto.response.VentaResponse;
import com.restaurante.dto.mapper.VentaMapper;
import com.restaurante.entity.*;
import com.restaurante.repository.*;
import com.restaurante.service.policy.VentaPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private RecetaProductoRepository recetaProductoRepository;

    @Autowired
    private ComboDetalleRepository comboDetalleRepository;

    @Autowired
    private ConsumoInsumoVentaRepository consumoInsumoVentaRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private LoteInsumoService loteInsumoService;

    @Autowired
    private LoteProductoService loteProductoService;

    @Autowired
    private LoteProductoRepository loteProductoRepository;

    @Autowired
    private CajaService cajaService;

    @Autowired
    private CajaRepository cajaRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private PedidoExtraRepository pedidoExtraRepository;

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;

    @Autowired
    private VentaPagoRepository ventaPagoRepository;

    @Autowired
    private ConfiguracionEmpresaRepository configuracionEmpresaRepository;

    @Autowired
    private PrecuentaService precuentaService;

    @Autowired
    private VentaMapper ventaMapper;

    @Autowired
    private VentaPolicy ventaPolicy;

    public VentaResponse registrarVenta(VentaRequest request, Empleado empleado) {
        // 1. Verificar sesión de Caja abierta para el empleado
        CajaResponse cajaResponse = cajaService.obtenerCajaAbiertaParaEmpleado(empleado)
                .orElseThrow(() -> new IllegalStateException(
                        "El empleado debe tener una caja abierta para realizar una venta."));

        Caja caja = cajaRepository.findById(cajaResponse.getIdCaja())
                .orElseThrow(() -> new IllegalStateException("Caja activa no encontrada."));

        // Fetch IGV percentage from company configuration
        ConfiguracionEmpresa config = configuracionEmpresaRepository.findAll().stream().findFirst().orElse(null);
        BigDecimal igvPorcentaje = (config != null && config.getIgv() != null)
                ? config.getIgv() : new BigDecimal("18.00");

        Venta venta = new Venta();
        venta.setEmpleado(empleado);
        venta.setCaja(caja);
        venta.setTipoComprobante(Venta.TipoComprobante.valueOf(request.getTipoComprobante().toUpperCase()));
        venta.setSerie(request.getSerie());
        venta.setNumero(request.getNumero());

        if (request.getIdPedido() != null) {
            Pedido pedido = pedidoRepository.findById(request.getIdPedido())
                    .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado."));
            venta.setPedido(pedido);
        }

        // Build detalles from pedido
        List<DetalleVenta> detalles = new ArrayList<>();
        if (venta.getPedido() != null) {
            List<DetallePedido> detallesPedido = detallePedidoRepository.findByPedidoIdPedido(venta.getPedido().getIdPedido());
            for (DetallePedido dp : detallesPedido) {
                DetalleVenta dv = new DetalleVenta();
                dv.setProducto(dp.getProducto());
                dv.setCombo(dp.getCombo());
                dv.setDetallePedido(dp);
                dv.setCantidad(dp.getCantidad());
                dv.setPrecioUnitario(dp.getPrecioUnitario());
                dv.setSubtotal(dp.getSubtotal());
                detalles.add(dv);
            }
        }
        if (detalles.isEmpty()) {
            throw new IllegalArgumentException("No se puede registrar una venta sin detalles.");
        }

        // Build VentaPago objects from request
        List<VentaPago> pagos = new ArrayList<>();
        if (request.getPagos() != null) {
            for (VentaPagoRequest pagoReq : request.getPagos()) {
                VentaPago pago = new VentaPago();
                MetodoPago metodoPago = metodoPagoRepository.findById(pagoReq.getIdMetodoPago())
                        .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado."));
                if (Boolean.TRUE.equals(metodoPago.getRequiereReferencia())
                        && (pagoReq.getReferencia() == null || pagoReq.getReferencia().isBlank())) {
                    throw new IllegalArgumentException("El método de pago requiere referencia: " + metodoPago.getNombre());
                }
                pago.setMetodoPago(metodoPago);
                pago.setMonto(pagoReq.getMonto());
                pago.setReferencia(pagoReq.getReferencia());
                pago.setEstado(VentaPago.Estado.APROBADO);
                pagos.add(pago);
            }
        }

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

        BigDecimal cienMasIgv = BigDecimal.valueOf(100).add(igvPorcentaje);
        BigDecimal subtotalGravado = totalCalculado.multiply(BigDecimal.valueOf(100))
                .divide(cienMasIgv, 4, RoundingMode.HALF_UP);
        BigDecimal igv = totalCalculado.subtract(subtotalGravado).setScale(4, RoundingMode.HALF_UP);

        venta.setSubtotal(subtotalGravado.setScale(2, RoundingMode.HALF_UP));
        venta.setIgv(igv.setScale(2, RoundingMode.HALF_UP));
        venta.setEstado(Venta.Estado.EMITIDA);

        // Persistencia inicial de la venta
        Venta ventaGuardada = ventaRepository.save(venta);

        for (DetalleVenta det : detalles) {
            det.setVenta(ventaGuardada);

            // Cálculo del costo unitario real
            BigDecimal costoUnitario = calcularCostoUnitario(det);
            det.setCostoUnitario(costoUnitario);

            detalleVentaRepository.save(det);
        }

        // Persistencia inicial de los pagos
        for (VentaPago pago : pagos) {
            pago.setVenta(ventaGuardada);
            ventaPagoRepository.save(pago);
        }

        return mapToDetailedResponse(ventaGuardada);
    }

    public VentaResponse generarVentaPagadaDesdePedido(Integer idPedido, CobrarPedidoRequest request, Empleado empleado) {
        ventaPolicy.validarPagosInformados(request.getPagos());

        CajaResponse cajaResponse = cajaService.obtenerCajaAbiertaParaEmpleado(empleado)
                .orElseThrow(() -> new IllegalStateException(
                        "El empleado debe tener una caja abierta para cobrar un pedido."));
        Caja caja = cajaRepository.findById(cajaResponse.getIdCaja())
                .orElseThrow(() -> new IllegalStateException("Caja activa no encontrada."));

        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado."));
        ventaPolicy.validarPedidoCobrable(pedido);
        ventaPolicy.validarFactura(request.getTipoComprobante(), pedido.getCliente());

        List<DetallePedido> detallesPedido = detallePedidoRepository.findByPedidoIdPedido(idPedido);
        if (detallesPedido.isEmpty()) {
            throw new IllegalArgumentException("No se puede cobrar un pedido sin detalles.");
        }

        ConfiguracionEmpresa config = configuracionEmpresaRepository.findAll().stream().findFirst().orElse(null);
        BigDecimal igvPorcentaje = (config != null && config.getIgv() != null)
                ? config.getIgv() : new BigDecimal("18.00");

        BigDecimal totalCalculado = detallesPedido.stream()
                .map(DetallePedido::getSubtotal)
                .filter(subtotal -> subtotal != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPagos = BigDecimal.ZERO;
        for (VentaPagoRequest pagoReq : request.getPagos()) {
            totalPagos = totalPagos.add(normalizarMonto(pagoReq.getMonto()));
        }
        ventaPolicy.validarMontoPagado(totalPagos, totalCalculado);

        Venta venta = new Venta();
        venta.setEmpleado(empleado);
        venta.setCaja(caja);
        venta.setPedido(pedido);
        venta.setTipoComprobante(Venta.TipoComprobante.valueOf(request.getTipoComprobante().toUpperCase()));
        venta.setSerie(request.getSerie());
        venta.setNumero(request.getNumero());
        venta.setTotal(totalCalculado);

        BigDecimal cienMasIgv = BigDecimal.valueOf(100).add(igvPorcentaje);
        BigDecimal subtotalGravado = totalCalculado.multiply(BigDecimal.valueOf(100))
                .divide(cienMasIgv, 4, RoundingMode.HALF_UP);
        BigDecimal igv = totalCalculado.subtract(subtotalGravado).setScale(4, RoundingMode.HALF_UP);
        venta.setSubtotal(subtotalGravado.setScale(2, RoundingMode.HALF_UP));
        venta.setIgv(igv.setScale(2, RoundingMode.HALF_UP));
        venta.setEstado(Venta.Estado.EMITIDA);

        Venta ventaGuardada = ventaRepository.save(venta);
        List<DetalleVenta> detallesVenta = new ArrayList<>();
        for (DetallePedido dp : detallesPedido) {
            DetalleVenta dv = new DetalleVenta();
            dv.setVenta(ventaGuardada);
            dv.setProducto(dp.getProducto());
            dv.setCombo(dp.getCombo());
            dv.setDetallePedido(dp);
            dv.setCantidad(dp.getCantidad());
            dv.setPrecioUnitario(dp.getPrecioUnitario());
            dv.setSubtotal(dp.getSubtotal());
            dv.setCostoUnitario(calcularCostoUnitario(dv));
            detallesVenta.add(detalleVentaRepository.save(dv));
        }

        for (DetalleVenta detalleVenta : detallesVenta) {
            descontarStockInventario(detalleVenta, empleado);
        }

        List<VentaPago> pagos = construirPagosAplicados(request.getPagos(), ventaGuardada, totalCalculado);
        for (VentaPago pago : pagos) {
            ventaPagoRepository.save(pago);
        }
        registrarMovimientosCajaPorPagos(
                caja,
                pagos,
                "Cobro Pedido #" + pedido.getIdPedido() + " - " + ventaGuardada.getComprobante(),
                ventaGuardada,
                empleado);

        pedido.setEstado(Pedido.Estado.CERRADO);
        if (pedido.getMesa() != null) {
            pedido.getMesa().setEstado(Mesa.Estado.DISPONIBLE);
        }
        pedidoRepository.save(pedido);
        precuentaService.marcarConvertida(pedido);

        return mapToDetailedResponse(ventaRepository.save(ventaGuardada));
    }

    public VentaResponse pagarVenta(Integer idVenta, List<VentaPagoRequest> pagosReq) {
        ventaPolicy.validarPagosInformados(pagosReq);

        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada."));
        ventaPolicy.validarVentaPagable(venta);

        Caja caja = venta.getCaja();
        BigDecimal totalPagos = BigDecimal.ZERO;
        for (VentaPagoRequest pagoReq : pagosReq) {
            totalPagos = totalPagos.add(normalizarMonto(pagoReq.getMonto()));
        }

        ventaPolicy.validarMontoPagado(totalPagos, venta.getTotal());

        List<VentaPago> pagos = construirPagosAplicados(pagosReq, venta, venta.getTotal());

        // 1. Deducción física de Stock en Inventarios
        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaIdVenta(venta.getIdVenta());
        for (DetalleVenta det : detalles) {
            descontarStockInventario(det, venta.getEmpleado());
        }

        for (VentaPago pago : pagos) {
            ventaPagoRepository.save(pago);
        }
        registrarMovimientosCajaPorPagos(
                caja,
                pagos,
                "Venta de productos - Comprobante: " + venta.getComprobante(),
                venta,
                venta.getEmpleado());

        venta.setEstado(Venta.Estado.EMITIDA);

        // Sincronización del estado del pedido vinculado si existe
        if (venta.getPedido() != null) {
            Pedido pedido = venta.getPedido();
            pedido.setEstado(Pedido.Estado.CERRADO);
            if (pedido.getMesa() != null) {
                pedido.getMesa().setEstado(Mesa.Estado.DISPONIBLE);
            }
            pedidoRepository.save(pedido);
        }

        Venta savedVenta = ventaRepository.save(venta);
        return mapToDetailedResponse(savedVenta);
    }

    private List<VentaPago> construirPagosAplicados(List<VentaPagoRequest> pagosReq, Venta venta, BigDecimal totalVenta) {
        ventaPolicy.validarPagosInformados(pagosReq);

        List<VentaPago> pagos = new ArrayList<>();
        BigDecimal saldoPendiente = totalVenta.setScale(2, RoundingMode.HALF_UP);

        for (VentaPagoRequest pagoReq : pagosReq) {
            if (saldoPendiente.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            MetodoPago metodoPago = metodoPagoRepository.findById(pagoReq.getIdMetodoPago())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Método de pago no encontrado con ID: " + pagoReq.getIdMetodoPago()));
            BigDecimal montoSolicitado = normalizarMonto(pagoReq.getMonto());

            if (montoSolicitado.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("El monto del pago debe ser mayor a 0.");
            }
            if (Boolean.TRUE.equals(metodoPago.getRequiereReferencia())
                    && (pagoReq.getReferencia() == null || pagoReq.getReferencia().isBlank())) {
                throw new IllegalArgumentException("El método de pago requiere referencia: " + metodoPago.getNombre());
            }

            BigDecimal montoAplicado = montoSolicitado
                    .min(saldoPendiente)
                    .setScale(2, RoundingMode.HALF_UP);

            VentaPago pago = new VentaPago();
            pago.setVenta(venta);
            pago.setMetodoPago(metodoPago);
            pago.setMonto(montoAplicado);
            pago.setReferencia(pagoReq.getReferencia());
            pago.setEstado(VentaPago.Estado.APROBADO);
            pagos.add(pago);

            saldoPendiente = saldoPendiente.subtract(montoAplicado);
        }

        if (saldoPendiente.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("El monto pagado es insuficiente. Saldo pendiente: " + saldoPendiente);
        }

        return pagos;
    }

    private void registrarMovimientosCajaPorPagos(Caja caja, List<VentaPago> pagos, String conceptoBase,
            Venta venta, Empleado empleado) {
        for (VentaPago pago : pagos) {
            if (!metodoAfectaCaja(pago.getMetodoPago())) {
                continue;
            }

            String nombreMetodo = pago.getMetodoPago() != null && pago.getMetodoPago().getNombre() != null
                    ? pago.getMetodoPago().getNombre()
                    : "Método no especificado";
            cajaService.registrarMovimiento(
                    caja.getIdCaja(),
                    MovimientoCaja.Tipo.INGRESO,
                    conceptoBase + " [" + nombreMetodo + "]",
                    pago.getMonto(),
                    empleado,
                    "VENTA",
                    venta.getIdVenta(),
                    venta.getComprobante());
        }
    }

    private BigDecimal normalizarMonto(BigDecimal monto) {
        if (monto == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return monto.setScale(2, RoundingMode.HALF_UP);
    }

    private boolean metodoAfectaCaja(MetodoPago metodoPago) {
        return metodoPago != null;
    }

    public VentaResponse anularVenta(Integer idVenta, String motivo, Empleado empleadoAnulacion) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada."));
        ventaPolicy.validarAnulable(venta, motivo);

        // 1. Reversión completa de stock al inventario
        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaIdVenta(venta.getIdVenta());
        for (DetalleVenta det : detalles) {
            revertirDescuentoStock(det, empleadoAnulacion);
        }
        revertirConsumosInsumosVenta(venta.getIdVenta(), empleadoAnulacion);

        // 2. Registro de contramovimiento (EGRESO) en la caja si ya estaba pagada
        if (venta.getEstado() == Venta.Estado.EMITIDA) {
            Caja caja = venta.getCaja();
            if (caja != null) {
                BigDecimal montoCaja = ventaPagoRepository.findByVentaIdVenta(venta.getIdVenta()).stream()
                        .filter(pago -> pago.getEstado() == VentaPago.Estado.APROBADO)
                        .filter(pago -> metodoAfectaCaja(pago.getMetodoPago()))
                        .map(VentaPago::getMonto)
                        .filter(monto -> monto != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (montoCaja.compareTo(BigDecimal.ZERO) > 0) {
                    cajaService.registrarMovimiento(
                            caja.getIdCaja(),
                            MovimientoCaja.Tipo.EGRESO,
                            "Anulación Pedido/Venta #" + venta.getIdVenta() + " - Ref: " + venta.getComprobante(),
                            montoCaja,
                            empleadoAnulacion,
                            "ANULACION_VENTA",
                            venta.getIdVenta(),
                            venta.getComprobante());
                }
            }
        }

        venta.setEstado(Venta.Estado.ANULADA);
        venta.setFechaAnulacion(LocalDateTime.now());
        venta.setMotivoAnulacion(motivo);
        if (venta.getPedido() != null) {
            Pedido pedido = venta.getPedido();
            pedido.setEstado(Pedido.Estado.CANCELADO);
            pedidoRepository.save(pedido);
        }

        Venta savedVenta = ventaRepository.save(venta);
        return mapToDetailedResponse(savedVenta);
    }

    @Transactional(readOnly = true)
    public Optional<VentaResponse> obtenerVentaPorId(Integer id) {
        return ventaRepository.findById(id).map(this::mapToDetailedResponse);
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarVentas() {
        return ventaRepository.findAll().stream()
                .map(this::mapToDetailedResponse)
                .collect(Collectors.toList());
    }

    private BigDecimal calcularCostoUnitario(DetalleVenta det) {
        BigDecimal costo = BigDecimal.ZERO;
        if (det.getProducto() != null) {
            Producto prod = det.getProducto();
            if (prod.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
                return prod.getPrecio().multiply(new BigDecimal("0.40"));
            } else {
                costo = costo.add(calcularCostoReceta(obtenerRecetaVenta(prod)));
            }
        } else if (det.getCombo() != null) {
            List<ComboDetalle> comboItems = comboDetalleRepository.findByComboIdCombo(det.getCombo().getIdCombo());
            for (ComboDetalle item : comboItems) {
                BigDecimal prodCost = BigDecimal.ZERO;
                if (item.getProducto().getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
                    prodCost = item.getProducto().getPrecio().multiply(new BigDecimal("0.40"));
                } else {
                    prodCost = prodCost.add(calcularCostoReceta(obtenerRecetaVenta(item.getProducto())));
                }
                costo = costo.add(prodCost.multiply(BigDecimal.valueOf(item.getCantidad())));
            }
        }
        return costo.add(calcularCostoExtras(det));
    }

    private BigDecimal calcularCostoReceta(List<RecetaProducto> receta) {
        BigDecimal costo = BigDecimal.ZERO;
        for (RecetaProducto item : receta) {
            costo = costo.add(item.getCantidad().multiply(item.getInsumo().getCostoPromedio()));
        }
        return costo;
    }

    private BigDecimal calcularCostoExtras(DetalleVenta det) {
        if (det.getDetallePedido() == null) {
            return BigDecimal.ZERO;
        }
        return pedidoExtraRepository.findByDetallePedidoIdDetallePedido(det.getDetallePedido().getIdDetallePedido()).stream()
                .filter(pedidoExtra -> pedidoExtra.getExtra() != null
                        && pedidoExtra.getExtra().getInsumo() != null
                        && pedidoExtra.getExtra().getCantidadConsumida() != null)
                .map(pedidoExtra -> pedidoExtra.getExtra().getCantidadConsumida()
                        .multiply(pedidoExtra.getExtra().getInsumo().getCostoPromedio())
                        .multiply(BigDecimal.valueOf(pedidoExtra.getCantidad() != null ? pedidoExtra.getCantidad() : 1)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<RecetaProducto> obtenerRecetaVenta(Producto producto) {
        return recetaProductoRepository.findByProductoIdProducto(producto.getIdProducto());
    }

    private void descontarStockInventario(DetalleVenta det, Empleado empleado) {
        int cantidadTotal = det.getCantidad();
        if (det.getProducto() != null) {
            descontarProducto(det.getProducto(), cantidadTotal, det, empleado);
        } else if (det.getCombo() != null) {
            List<ComboDetalle> comboItems = comboDetalleRepository.findByComboIdCombo(det.getCombo().getIdCombo());
            for (ComboDetalle item : comboItems) {
                descontarProducto(item.getProducto(), item.getCantidad() * cantidadTotal, det, empleado);
            }
        }
        descontarExtras(det, empleado);
    }

    private void descontarProducto(Producto prod, int cantidad, DetalleVenta det, Empleado empleado) {
        Venta venta = det.getVenta();
        if (prod.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
            if (Boolean.FALSE.equals(prod.getEsSku())) {
                throw new IllegalStateException("No se puede vender un producto padre como stock directo: " + prod.getNombre());
            }
            BigDecimal stockCursor = BigDecimal.valueOf(loteProductoRepository.sumDisponibleByProducto(prod.getIdProducto()));
            List<LoteProductoService.DescuentoLoteProducto> descuentos = loteProductoService.descontarFifo(prod, cantidad);

            for (LoteProductoService.DescuentoLoteProducto descuento : descuentos) {
                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoRecurso(MovimientoInventario.TipoRecurso.PRODUCTO);
                mov.setProducto(prod);
                mov.setLoteProducto(descuento.lote());
                mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.SALIDA_VENTA);
                mov.setReferenceType("VENTA");
                mov.setReferenceId(venta.getIdVenta());
                mov.setCantidad(BigDecimal.valueOf(descuento.cantidad()));
                aplicarSnapshotSalida(mov, stockCursor, BigDecimal.valueOf(descuento.cantidad()), descuento.lote().getCostoUnitario());
                mov.setMotivo("Venta directa de SKU producto");
                mov.setEmpleado(empleado);
                movimientoInventarioRepository.save(mov);
                stockCursor = mov.getStockNuevo();
            }

        } else {
            List<RecetaProducto> receta = obtenerRecetaVenta(prod);
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

                List<LoteInsumoService.DescuentoLote> descuentos = loteInsumoService.descontarFifo(insumo, cantidadNecesaria);
                BigDecimal stockCursor = insumo.getStock();
                insumo.setStock(insumo.getStock().subtract(cantidadNecesaria));
                insumoRepository.save(insumo);

                for (LoteInsumoService.DescuentoLote descuento : descuentos) {
                    ConsumoInsumoVenta consumo = new ConsumoInsumoVenta();
                    consumo.setVenta(venta);
                    consumo.setDetalleVenta(det);
                    consumo.setInsumo(insumo);
                    consumo.setLoteInsumo(descuento.lote());
                    consumo.setCantidad(descuento.cantidad());
                    consumo.setCostoUnitario(descuento.lote().getCostoUnitario());
                    consumo.setCostoTotal(descuento.cantidad()
                            .multiply(descuento.lote().getCostoUnitario())
                            .setScale(2, RoundingMode.HALF_UP));
                    consumoInsumoVentaRepository.save(consumo);

                    MovimientoInventario mov = new MovimientoInventario();
                    mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
                    mov.setInsumo(insumo);
                    mov.setLoteInsumo(descuento.lote());
                    mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.SALIDA_VENTA);
                    mov.setReferenceType("VENTA");
                    mov.setReferenceId(venta.getIdVenta());
                    mov.setCantidad(descuento.cantidad());
                    aplicarSnapshotSalida(mov, stockCursor, descuento.cantidad(), descuento.lote().getCostoUnitario());
                    mov.setMotivo("Consumo en venta de " + prod.getNombre());
                    mov.setEmpleado(empleado);
                    movimientoInventarioRepository.save(mov);
                    stockCursor = mov.getStockNuevo();
                }
            }
        }
    }

    private void descontarExtras(DetalleVenta det, Empleado empleado) {
        if (det.getDetallePedido() == null) {
            return;
        }

        List<PedidoExtra> extras = pedidoExtraRepository
                .findByDetallePedidoIdDetallePedido(det.getDetallePedido().getIdDetallePedido());
        for (PedidoExtra pedidoExtra : extras) {
            ExtraProducto extra = pedidoExtra.getExtra();
            if (extra == null || extra.getInsumo() == null || extra.getCantidadConsumida() == null) {
                throw new IllegalStateException("El extra no tiene insumo/cantidad de consumo configurados.");
            }

            Insumo insumo = extra.getInsumo();
            int cantidadExtra = pedidoExtra.getCantidad() != null ? pedidoExtra.getCantidad() : 1;
            BigDecimal cantidadNecesaria = extra.getCantidadConsumida()
                    .multiply(BigDecimal.valueOf(det.getCantidad()))
                    .multiply(BigDecimal.valueOf(cantidadExtra));

            if (insumo.getStock().compareTo(cantidadNecesaria) < 0) {
                throw new IllegalStateException("Stock insuficiente para el extra: " + extra.getNombre()
                        + ". Insumo: " + insumo.getNombre() + ". Disponible: " + insumo.getStock());
            }

            List<LoteInsumoService.DescuentoLote> descuentos = loteInsumoService.descontarFifo(insumo, cantidadNecesaria);
            BigDecimal stockCursor = insumo.getStock();
            insumo.setStock(insumo.getStock().subtract(cantidadNecesaria));
            insumoRepository.save(insumo);

            for (LoteInsumoService.DescuentoLote descuento : descuentos) {
                ConsumoInsumoVenta consumo = new ConsumoInsumoVenta();
                consumo.setVenta(det.getVenta());
                consumo.setDetalleVenta(det);
                consumo.setInsumo(insumo);
                consumo.setLoteInsumo(descuento.lote());
                consumo.setCantidad(descuento.cantidad());
                consumo.setCostoUnitario(descuento.lote().getCostoUnitario());
                consumo.setCostoTotal(descuento.cantidad()
                        .multiply(descuento.lote().getCostoUnitario())
                        .setScale(2, RoundingMode.HALF_UP));
                consumoInsumoVentaRepository.save(consumo);

                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
                mov.setInsumo(insumo);
                mov.setLoteInsumo(descuento.lote());
                mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.SALIDA_VENTA);
                mov.setReferenceType("VENTA");
                mov.setReferenceId(det.getVenta().getIdVenta());
                mov.setCantidad(descuento.cantidad());
                aplicarSnapshotSalida(mov, stockCursor, descuento.cantidad(), descuento.lote().getCostoUnitario());
                mov.setMotivo("Consumo extra " + extra.getNombre() + " en venta");
                mov.setEmpleado(empleado);
                movimientoInventarioRepository.save(mov);
                stockCursor = mov.getStockNuevo();
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
            List<MovimientoInventario> consumosProducto = movimientoInventarioRepository
                    .findByReferenceIdAndReferenceTypeAndTipoRecurso(
                            ventaId,
                            "VENTA",
                            MovimientoInventario.TipoRecurso.PRODUCTO)
                    .stream()
                    .filter(mov -> mov.getProducto() != null
                            && prod.getIdProducto().equals(mov.getProducto().getIdProducto()))
                    .collect(Collectors.toList());

            for (MovimientoInventario consumo : consumosProducto) {
                int cantidadDevuelta = consumo.getCantidad().intValue();
                if (consumo.getLoteProducto() != null) {
                    loteProductoService.devolverALote(consumo.getLoteProducto(), cantidadDevuelta);
                }

                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoRecurso(MovimientoInventario.TipoRecurso.PRODUCTO);
                mov.setProducto(prod);
                mov.setLoteProducto(consumo.getLoteProducto());
                mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.DEVOLUCION);
                mov.setReferenceType("ANULACION_VENTA");
                mov.setReferenceId(ventaId);
                mov.setCantidad(consumo.getCantidad());
                aplicarSnapshotEntrada(mov, consumo.getStockNuevo(), consumo.getCantidad(), consumo.getCostoUnitario());
                mov.setMotivo("Reversión por anulación de venta");
                mov.setEmpleado(empleado);
                movimientoInventarioRepository.save(mov);
            }
        }
    }

    private void revertirConsumosInsumosVenta(Integer ventaId, Empleado empleado) {
        List<ConsumoInsumoVenta> consumos = consumoInsumoVentaRepository.findByVentaIdVenta(ventaId);
        for (ConsumoInsumoVenta consumo : consumos) {
            Insumo insumo = consumo.getInsumo();
            BigDecimal stockAnterior = insumo.getStock();
            if (consumo.getLoteInsumo() != null) {
                loteInsumoService.devolverALote(consumo.getLoteInsumo(), consumo.getCantidad());
            }

            insumo.setStock(insumo.getStock().add(consumo.getCantidad()));
            insumoRepository.save(insumo);

            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
            mov.setInsumo(insumo);
            mov.setLoteInsumo(consumo.getLoteInsumo());
            mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.DEVOLUCION);
            mov.setReferenceType("ANULACION_VENTA");
            mov.setReferenceId(ventaId);
            mov.setCantidad(consumo.getCantidad());
            aplicarSnapshotEntrada(mov, stockAnterior, consumo.getCantidad(), consumo.getCostoUnitario());
            mov.setMotivo("Reversión por anulación de venta");
            mov.setEmpleado(empleado);
            movimientoInventarioRepository.save(mov);
        }
    }

    private void aplicarSnapshotSalida(MovimientoInventario movimiento, BigDecimal stockAnterior,
            BigDecimal cantidad, BigDecimal costoUnitario) {
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockNuevo(stockAnterior.subtract(cantidad));
        movimiento.setCostoUnitario(costoUnitario);
        movimiento.setSaldoValorizado(calcularSaldoValorizado(movimiento.getStockNuevo(), costoUnitario));
    }

    private void aplicarSnapshotEntrada(MovimientoInventario movimiento, BigDecimal stockAnterior,
            BigDecimal cantidad, BigDecimal costoUnitario) {
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockNuevo(stockAnterior.add(cantidad));
        movimiento.setCostoUnitario(costoUnitario);
        movimiento.setSaldoValorizado(calcularSaldoValorizado(movimiento.getStockNuevo(), costoUnitario));
    }

    private BigDecimal calcularSaldoValorizado(BigDecimal stock, BigDecimal costoUnitario) {
        if (stock == null || costoUnitario == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return stock.multiply(costoUnitario).setScale(2, RoundingMode.HALF_UP);
    }

    private VentaResponse mapToDetailedResponse(Venta venta) {
        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaIdVenta(venta.getIdVenta());
        List<VentaPago> pagos = ventaPagoRepository.findByVentaIdVenta(venta.getIdVenta());
        return ventaMapper.toResponse(venta, detalles, pagos);
    }
}
