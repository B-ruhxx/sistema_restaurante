package com.restaurante.service;

import com.restaurante.dto.DetallePedidoRequest;
import com.restaurante.dto.PedidoRequest;
import com.restaurante.dto.mapper.PedidoMapper;
import com.restaurante.dto.request.AbrirPedidoMesaRequest;
import com.restaurante.dto.response.DetallePedidoResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.entity.*;
import com.restaurante.exception.ResourceNotFoundException;
import com.restaurante.repository.*;
import com.restaurante.service.policy.PedidoPolicy;
import com.restaurante.service.policy.ProductoPolicy;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PedidoService {
    private static final BigDecimal IGV_PORCENTAJE = new BigDecimal("18.00");
    private static final Set<Pedido.Estado> ESTADOS_ACTIVOS_POR_MESA = Set.of(
            Pedido.Estado.BORRADOR_ATENCION,
            Pedido.Estado.EN_COCINA,
            Pedido.Estado.LISTO,
            Pedido.Estado.SERVIDO,
            Pedido.Estado.CUENTA);
    private static final Set<Pedido.Estado> ESTADOS_NO_MODIFICABLES = Set.of(
            Pedido.Estado.CUENTA,
            Pedido.Estado.CERRADO,
            Pedido.Estado.CANCELADO);

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private PedidoExtraRepository pedidoExtraRepository;

    @Autowired
    private PedidoEstadoHistorialRepository pedidoEstadoHistorialRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ComboProductoRepository comboProductoRepository;

    @Autowired
    private ComboDetalleRepository comboDetalleRepository;

    @Autowired
    private ExtraProductoRepository extraProductoRepository;

    @Autowired
    private RecetaProductoRepository recetaProductoRepository;

    @Autowired
    private PedidoMapper pedidoMapper;

    @Autowired
    private ProductoPolicy productoPolicy;

    @Autowired
    private PedidoPolicy pedidoPolicy;

    public PedidoResponse crearPedido(PedidoRequest request, Empleado empleado) {
        Pedido pedido = new Pedido();
        pedido.setEmpleado(empleado);
        pedido.setEstado(Pedido.Estado.BORRADOR_ATENCION);
        asignarClienteSiExiste(pedido, request.getIdCliente());

        if (request.getIdMesa() == null) {
            throw new IllegalArgumentException("Un pedido de salón debe estar asociado a una mesa.");
        }
        Mesa mesa = validarMesaLibre(request.getIdMesa());
        pedido.setMesa(mesa);
        mesa.setEstado(Mesa.Estado.ATENCION);

        Pedido pedidoGuardado = pedidoRepository.save(pedido);
        if (request.getDetalles() != null) {
            for (DetallePedidoRequest item : request.getDetalles()) {
                crearDetalle(pedidoGuardado, item);
            }
        }

        recalcularTotales(pedidoGuardado);
        registrarHistorial(pedidoGuardado, Pedido.Estado.BORRADOR_ATENCION, empleado);
        return mapToDetailedResponse(pedidoRepository.save(pedidoGuardado));
    }

    public PedidoResponse abrirPedidoMesa(Integer idMesa, AbrirPedidoMesaRequest request, Empleado empleado) {
        Mesa mesa = validarMesaLibre(idMesa);

        Pedido pedido = new Pedido();
        pedido.setEmpleado(empleado);
        pedido.setMesa(mesa);
        pedido.setEstado(Pedido.Estado.BORRADOR_ATENCION);
        asignarClienteSiExiste(pedido, request != null ? request.getIdCliente() : null);

        mesa.setEstado(Mesa.Estado.ATENCION);
        Pedido pedidoGuardado = pedidoRepository.save(pedido);
        registrarHistorial(pedidoGuardado, Pedido.Estado.BORRADOR_ATENCION, empleado);
        return mapToDetailedResponse(pedidoGuardado);
    }

    @Transactional(readOnly = true)
    public Optional<PedidoResponse> obtenerPedidoActivoPorMesa(Integer idMesa) {
        return pedidoRepository.findFirstByMesaIdMesaAndEstadoInOrderByFechaAperturaDesc(idMesa, ESTADOS_ACTIVOS_POR_MESA)
                .map(this::mapToDetailedResponse);
    }

    public PedidoResponse asignarCliente(Integer idPedido, Integer idCliente) {
        Pedido pedido = findPedido(idPedido);
        validarModificable(pedido);
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado."));
        pedido.setCliente(cliente);
        return mapToDetailedResponse(pedidoRepository.save(pedido));
    }

    public DetallePedidoResponse agregarDetalle(Integer idPedido, DetallePedidoRequest request) {
        Pedido pedido = findPedido(idPedido);
        validarModificable(pedido);
        DetallePedido detalle = crearDetalle(pedido, request);
        recalcularTotales(pedido);
        if (pedido.getEstado() == Pedido.Estado.SERVIDO || pedido.getEstado() == Pedido.Estado.LISTO) {
            cambiarEstadoInterno(pedido, Pedido.Estado.BORRADOR_ATENCION, pedido.getEmpleado());
            if (pedido.getMesa() != null) {
                pedido.getMesa().setEstado(Mesa.Estado.ATENCION);
            }
        }
        pedidoRepository.save(pedido);
        List<PedidoExtra> extras = pedidoExtraRepository.findByDetallePedidoIdDetallePedido(detalle.getIdDetallePedido());
        return pedidoMapper.toDetalleResponse(detalle, extras);
    }

    public PedidoResponse enviarACocina(Integer idPedido, Empleado empleado) {
        Pedido pedido = findPedido(idPedido);
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdPedido(idPedido);
        List<DetallePedido> detallesPendientes = detalles.stream()
                .filter(detalle -> detalle.getEstadoCocina() == null
                        || detalle.getEstadoCocina() == DetallePedido.EstadoCocina.PENDIENTE)
                .filter(detalle -> Boolean.TRUE.equals(detalle.getRequierePreparacion()))
                .collect(Collectors.toList());
        if (detallesPendientes.isEmpty()) {
            if (!detalles.isEmpty() && detalles.stream().noneMatch(detalle -> Boolean.TRUE.equals(detalle.getRequierePreparacion()))) {
                cambiarEstadoInterno(pedido, Pedido.Estado.SERVIDO, empleado);
                if (pedido.getMesa() != null) {
                    pedido.getMesa().setEstado(Mesa.Estado.SERVIDO);
                }
                return mapToDetailedResponse(pedidoRepository.save(pedido));
            }
            throw new IllegalArgumentException("No hay nuevos productos preparables pendientes para enviar a cocina.");
        }
        if (pedido.getEstado() != Pedido.Estado.BORRADOR_ATENCION
                && pedido.getEstado() != Pedido.Estado.SERVIDO
                && pedido.getEstado() != Pedido.Estado.LISTO
                && pedido.getEstado() != Pedido.Estado.EN_COCINA) {
            throw new IllegalStateException("Solo se puede enviar a cocina un pedido abierto.");
        }

        int estimado = 0;
        for (DetallePedido detalle : detallesPendientes) {
            int detalleEstimado = calcularTiempoEstimadoDetalle(detalle);
            detalle.setTiempoEstimadoMinutos(detalleEstimado);
            detalle.setEstadoCocina(DetallePedido.EstadoCocina.PENDIENTE);
            detallePedidoRepository.save(detalle);
            estimado = Math.max(estimado, detalleEstimado);
        }

        pedido.setFechaEnvioCocina(LocalDateTime.now());
        pedido.setTiempoEstimadoMinutos(estimado);
        if (pedido.getEstado() != Pedido.Estado.EN_COCINA) {
            cambiarEstadoInterno(pedido, Pedido.Estado.EN_COCINA, empleado);
        }
        if (pedido.getMesa() != null) {
            pedido.getMesa().setEstado(Mesa.Estado.EN_COCINA);
        }
        return mapToDetailedResponse(pedidoRepository.save(pedido));
    }

    public PedidoResponse actualizarEstado(Integer idPedido, Pedido.Estado nuevoEstado, Empleado empleado) {
        Pedido pedido = findPedido(idPedido);
        if (pedido.getEstado() == Pedido.Estado.CERRADO && nuevoEstado != Pedido.Estado.CANCELADO) {
            throw new IllegalStateException("No se puede modificar un pedido pagado.");
        }
        pedidoPolicy.validarTransicion(pedido, nuevoEstado);
        cambiarEstadoInterno(pedido, nuevoEstado, empleado);
        sincronizarMesaPorEstado(pedido);
        return mapToDetailedResponse(pedidoRepository.save(pedido));
    }

    public PedidoResponse cancelarPedido(Integer idPedido, String motivo, Empleado empleado) {
        Pedido pedido = findPedido(idPedido);
        pedidoPolicy.validarCancelacion(pedido, empleado, motivo);
        detallePedidoRepository.findByPedidoIdPedido(idPedido).forEach(detalle -> {
            if (detalle.getEstadoCocina() != DetallePedido.EstadoCocina.LISTO) {
                detalle.setEstadoCocina(DetallePedido.EstadoCocina.CANCELADO);
                detallePedidoRepository.save(detalle);
            }
        });
        pedido.setMotivoCancelacion(motivo.trim());
        cambiarEstadoInterno(pedido, Pedido.Estado.CANCELADO, empleado);
        if (pedido.getMesa() != null) {
            pedido.getMesa().setEstado(Mesa.Estado.DISPONIBLE);
        }
        return mapToDetailedResponse(pedidoRepository.save(pedido));
    }

    public void cambiarEstadoInterno(Pedido pedido, Pedido.Estado nuevoEstado, Empleado empleado) {
        pedido.setEstado(nuevoEstado);
        registrarHistorial(pedido, nuevoEstado, empleado);
    }

    @Transactional(readOnly = true)
    public Optional<PedidoResponse> obtenerPedidoPorId(Integer idPedido) {
        return pedidoRepository.findById(idPedido).map(this::mapToDetailedResponse);
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarPedidos() {
        return pedidoRepository.findAll().stream()
                .map(this::mapToDetailedResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarPedidosCobrables() {
        return pedidoRepository.findByEstadoIn(List.of(Pedido.Estado.CUENTA)).stream()
                .map(this::mapToDetailedResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> buscarPedidosParaCaja(String query) {
        String normalized = query == null ? "" : query.trim();
        LinkedHashMap<Integer, Pedido> encontrados = new LinkedHashMap<>();
        pedidoRepository.buscarParaCaja(normalized, List.of(Pedido.Estado.CUENTA))
                .forEach(pedido -> encontrados.put(pedido.getIdPedido(), pedido));
        if (normalized.matches("\\d+")) {
            pedidoRepository.findById(Integer.valueOf(normalized))
                    .filter(pedido -> pedido.getEstado() == Pedido.Estado.CUENTA)
                    .ifPresent(pedido -> encontrados.put(pedido.getIdPedido(), pedido));
        }
        return encontrados.values().stream().map(this::mapToDetailedResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> obtenerPedidosCobrablesPorMesa(Integer idMesa) {
        return pedidoRepository.findByMesaIdMesaAndEstadoIn(idMesa, List.of(Pedido.Estado.CUENTA))
                .stream()
                .map(this::mapToDetailedResponse)
                .collect(Collectors.toList());
    }

    public List<DetallePedidoResponse> obtenerDetalles(Integer idPedido) {
        return detallePedidoRepository.findByPedidoIdPedido(idPedido).stream()
                .map(det -> {
                    List<PedidoExtra> extras = pedidoExtraRepository.findByDetallePedidoIdDetallePedido(det.getIdDetallePedido());
                    return pedidoMapper.toDetalleResponse(det, extras);
                })
                .collect(Collectors.toList());
    }

    public void recalcularTotales(Pedido pedido) {
        BigDecimal total = detallePedidoRepository.findByPedidoIdPedido(pedido.getIdPedido()).stream()
                .map(DetallePedido::getSubtotal)
                .filter(subtotal -> subtotal != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal divisor = BigDecimal.valueOf(100).add(IGV_PORCENTAJE);
        BigDecimal subtotal = total.multiply(BigDecimal.valueOf(100)).divide(divisor, 4, RoundingMode.HALF_UP);
        BigDecimal igv = total.subtract(subtotal);
        pedido.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        pedido.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        pedido.setIgv(igv.setScale(2, RoundingMode.HALF_UP));
    }

    public Pedido findPedido(Integer idPedido) {
        return pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado."));
    }

    private DetallePedido crearDetalle(Pedido pedido, DetallePedidoRequest item) {
        if (item.getCantidad() == null || item.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0.");
        }

        DetallePedido detalle = new DetallePedido();
        detalle.setPedido(pedido);
        detalle.setCantidad(item.getCantidad());
        detalle.setObservacion(item.getObservacion());

        BigDecimal precioUnitario = BigDecimal.ZERO;
        if (item.getIdProducto() != null) {
            Producto prod = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + item.getIdProducto()));
            productoPolicy.validarVendible(prod, recetaProductoRepository);
            productoPolicy.validarEnrutamientoCocina(prod);
            detalle.setProducto(prod);
            detalle.setRequierePreparacion(prod.getTipoProducto() == Producto.TipoProducto.PREPARADO);
            if (!Boolean.TRUE.equals(detalle.getRequierePreparacion())) {
                detalle.setEstadoCocina(DetallePedido.EstadoCocina.LISTO);
            }
            precioUnitario = prod.getPrecio();
        } else if (item.getIdCombo() != null) {
            ComboProducto combo = comboProductoRepository.findById(item.getIdCombo())
                    .orElseThrow(() -> new ResourceNotFoundException("Combo no encontrado: " + item.getIdCombo()));
            detalle.setCombo(combo);
            precioUnitario = combo.getPrecio();
        } else {
            throw new IllegalArgumentException("El detalle del pedido debe contener un producto o un combo.");
        }

        detalle.setPrecioUnitario(precioUnitario);
        BigDecimal subtotalAcumulado = precioUnitario.multiply(BigDecimal.valueOf(item.getCantidad()));

        if (item.getExtrasIds() != null && !item.getExtrasIds().isEmpty()) {
            for (Integer extraId : item.getExtrasIds()) {
                ExtraProducto extra = extraProductoRepository.findById(extraId)
                        .orElseThrow(() -> new ResourceNotFoundException("Extra de producto no encontrado: " + extraId));
                validarExtraVendible(extra);
                subtotalAcumulado = subtotalAcumulado.add(extra.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad())));
            }
        }

        detalle.setSubtotal(subtotalAcumulado);
        DetallePedido detalleGuardado = detallePedidoRepository.save(detalle);

        if (item.getExtrasIds() != null && !item.getExtrasIds().isEmpty()) {
            for (Integer extraId : item.getExtrasIds()) {
                ExtraProducto extra = extraProductoRepository.findById(extraId)
                        .orElseThrow(() -> new ResourceNotFoundException("Extra de producto no encontrado: " + extraId));
                validarExtraVendible(extra);
                PedidoExtra pedExtra = new PedidoExtra();
                pedExtra.setDetallePedido(detalleGuardado);
                pedExtra.setExtra(extra);
                pedExtra.setCantidad(1);
                pedExtra.setPrecioUnitario(extra.getPrecio());
                pedExtra.setSubtotal(extra.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad())));
                pedidoExtraRepository.save(pedExtra);
            }
        }

        return detalleGuardado;
    }

    private void validarExtraVendible(ExtraProducto extra) {
        if (extra.getEstado() != ExtraProducto.Estado.ACTIVO) {
            throw new IllegalStateException("El extra no está activo: " + extra.getNombre());
        }
        if (extra.getInsumo() == null || extra.getCantidadConsumida() == null
                || extra.getCantidadConsumida().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("El extra no tiene insumo/cantidad de consumo configurados: " + extra.getNombre());
        }
    }

    private Mesa validarMesaLibre(Integer idMesa) {
        Mesa mesa = mesaRepository.findById(idMesa)
                .orElseThrow(() -> new ResourceNotFoundException("Mesa no encontrada."));
        if (mesa.getEstado() != Mesa.Estado.DISPONIBLE) {
            throw new IllegalStateException("La mesa no está libre.");
        }
        if (pedidoRepository.existsByMesaIdMesaAndEstadoIn(idMesa, ESTADOS_ACTIVOS_POR_MESA)) {
            throw new IllegalStateException("La mesa ya tiene un pedido activo.");
        }
        return mesa;
    }

    private void asignarClienteSiExiste(Pedido pedido, Integer idCliente) {
        if (idCliente != null) {
            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado."));
            pedido.setCliente(cliente);
        }
    }

    private void validarModificable(Pedido pedido) {
        if (ESTADOS_NO_MODIFICABLES.contains(pedido.getEstado())) {
            throw new IllegalStateException("No se puede modificar un pedido en estado " + pedido.getEstado() + ".");
        }
    }

    private void sincronizarMesaPorEstado(Pedido pedido) {
        if (pedido.getMesa() == null) return;
        if (pedido.getEstado() == Pedido.Estado.SERVIDO) {
            pedido.getMesa().setEstado(Mesa.Estado.SERVIDO);
        } else if (pedido.getEstado() == Pedido.Estado.LISTO) {
            pedido.getMesa().setEstado(Mesa.Estado.EN_COCINA);
        } else if (pedido.getEstado() == Pedido.Estado.CERRADO) {
            pedido.getMesa().setEstado(Mesa.Estado.DISPONIBLE);
        } else if (pedido.getEstado() == Pedido.Estado.CANCELADO) {
            pedido.getMesa().setEstado(Mesa.Estado.DISPONIBLE);
        }
    }

    private int calcularTiempoEstimadoDetalle(DetallePedido detalle) {
        if (!Boolean.TRUE.equals(detalle.getRequierePreparacion())) {
            return 0;
        }
        if (detalle.getProducto() != null) {
            return calcularTiempoEstimadoProducto(detalle.getProducto().getIdProducto());
        }
        if (detalle.getCombo() != null) {
            return comboDetalleRepository.findByComboIdCombo(detalle.getCombo().getIdCombo()).stream()
                    .mapToInt(item -> calcularTiempoEstimadoProducto(item.getProducto().getIdProducto()))
                    .max()
                    .orElse(1);
        }
        return 1;
    }

    private int calcularTiempoEstimadoProducto(Integer idProducto) {
        return productoRepository.findById(idProducto)
                .map(Producto::getTiempoPreparacionMinutos)
                .filter(tiempo -> tiempo != null && tiempo > 0)
                .orElse(1);
    }

    private void registrarHistorial(Pedido pedido, Pedido.Estado estado, Empleado empleado) {
        PedidoEstadoHistorial historial = new PedidoEstadoHistorial();
        historial.setPedido(pedido);
        historial.setEstado(estado);
        historial.setEmpleado(empleado);
        pedidoEstadoHistorialRepository.save(historial);
    }

    private PedidoResponse mapToDetailedResponse(Pedido pedido) {
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdPedido(pedido.getIdPedido());
        List<DetallePedidoResponse> detalleResponses = detalles.stream()
                .map(det -> {
                    List<PedidoExtra> extras = pedidoExtraRepository.findByDetallePedidoIdDetallePedido(det.getIdDetallePedido());
                    return pedidoMapper.toDetalleResponse(det, extras);
                })
                .collect(Collectors.toList());
        return pedidoMapper.toResponse(pedido, detalleResponses);
    }
}
