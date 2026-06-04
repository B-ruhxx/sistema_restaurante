package com.restaurante.service;

import com.restaurante.dto.DetallePedidoRequest;
import com.restaurante.dto.PedidoRequest;
import com.restaurante.entity.*;
import com.restaurante.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PedidoService {

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
    private ProductoRepository productoRepository;

    @Autowired
    private ComboProductoRepository comboProductoRepository;

    @Autowired
    private VarianteProductoRepository varianteProductoRepository;

    @Autowired
    private ExtraProductoRepository extraProductoRepository;

    public Pedido crearPedido(PedidoRequest request, Empleado empleado) {
        Pedido pedido = new Pedido();
        pedido.setEmpleado(empleado);
        pedido.setEstado(Pedido.Estado.PENDIENTE);

        if (request.getIdCliente() != null) {
            Cliente cliente = clienteRepository.findById(request.getIdCliente())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado."));
            pedido.setCliente(cliente);
        }

        // 1. Guardamos el pedido base
        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        // 2. Procesar detalles de forma eficiente
        for (DetallePedidoRequest item : request.getDetalles()) {
            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedidoGuardado);
            detalle.setCantidad(item.getCantidad());
            detalle.setObservacion(item.getObservacion());

            BigDecimal precioUnitario = BigDecimal.ZERO;

            // Determinar si es producto (con variante) o combo
            if (item.getIdProducto() != null) {
                Producto prod = productoRepository.findById(item.getIdProducto())
                        .orElseThrow(
                                () -> new IllegalArgumentException("Producto no encontrado: " + item.getIdProducto()));
                detalle.setProducto(prod);
                precioUnitario = prod.getPrecio();

                if (item.getIdVariante() != null) {
                    VarianteProducto variante = varianteProductoRepository.findById(item.getIdVariante())
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Variante no encontrada: " + item.getIdVariante()));
                    detalle.setVariante(variante);
                    if (variante.getPrecioExtra() != null) {
                        precioUnitario = precioUnitario.add(variante.getPrecioExtra());
                    }
                }
            } else if (item.getIdCombo() != null) {
                ComboProducto combo = comboProductoRepository.findById(item.getIdCombo())
                        .orElseThrow(() -> new IllegalArgumentException("Combo no encontrado: " + item.getIdCombo()));
                detalle.setCombo(combo);
                precioUnitario = combo.getPrecio();
            } else {
                throw new IllegalArgumentException("El detalle del pedido debe contener un producto o un combo.");
            }

            detalle.setPrecioUnitario(precioUnitario);

            // Subtotal inicial base (precio unitario * cantidad)
            BigDecimal subtotalAcumulado = precioUnitario.multiply(BigDecimal.valueOf(item.getCantidad()));

            // Sumar el costo de los extras directamente al subtotal antes de guardar el
            // detalle
            if (item.getExtrasIds() != null && !item.getExtrasIds().isEmpty()) {
                for (Integer extraId : item.getExtrasIds()) {
                    ExtraProducto extra = extraProductoRepository.findById(extraId)
                            .orElseThrow(
                                    () -> new IllegalArgumentException("Extra de producto no encontrado: " + extraId));

                    // Precio del extra * cantidad de platos en el ítem
                    BigDecimal costoExtraTotal = extra.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad()));
                    subtotalAcumulado = subtotalAcumulado.add(costoExtraTotal);
                }
            }

            // Asignamos el subtotal final calculado
            detalle.setSubtotal(subtotalAcumulado);

            // 3. Persistencia única del detalle con su precio y subtotal finales correctos
            DetallePedido detalleGuardado = detallePedidoRepository.save(detalle);

            // 4. Guardar los registros de la tabla intermedia de extras
            if (item.getExtrasIds() != null && !item.getExtrasIds().isEmpty()) {
                for (Integer extraId : item.getExtrasIds()) {
                    // Usamos findById que es el método estándar y seguro de Spring Data
                    ExtraProducto extra = extraProductoRepository.findById(extraId)
                            .orElseThrow(
                                    () -> new IllegalArgumentException("Extra de producto no encontrado: " + extraId));

                    PedidoExtra pedExtra = new PedidoExtra();
                    pedExtra.setDetallePedido(detalleGuardado);
                    pedExtra.setExtra(extra);
                    pedExtra.setCantidad(1); // Por defecto 1
                    pedidoExtraRepository.save(pedExtra);
                }
            }
        }

        // 5. Registrar estado inicial en el historial (Se llena el campo 'fecha' vía
        // @CreationTimestamp)
        PedidoEstadoHistorial historial = new PedidoEstadoHistorial();
        historial.setPedido(pedidoGuardado);
        historial.setEstado(Pedido.Estado.PENDIENTE);
        historial.setEmpleado(empleado);
        pedidoEstadoHistorialRepository.save(historial);

        return pedidoGuardado;
    }

    public Pedido actualizarEstado(Integer idPedido, Pedido.Estado nuevoEstado, Empleado empleado) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado."));

        pedido.setEstado(nuevoEstado);
        Pedido pedidoActualizado = pedidoRepository.save(pedido);

        // Registrar entrada en el historial
        PedidoEstadoHistorial historial = new PedidoEstadoHistorial();
        historial.setPedido(pedidoActualizado);
        historial.setEstado(nuevoEstado);
        historial.setEmpleado(empleado);
        pedidoEstadoHistorialRepository.save(historial);

        return pedidoActualizado;
    }

    @Transactional(readOnly = true)
    public Optional<Pedido> obtenerPedidoPorId(Integer idPedido) {
        return pedidoRepository.findById(idPedido);
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPedidos() {
        return pedidoRepository.findAll();
    }
}