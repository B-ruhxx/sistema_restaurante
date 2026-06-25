package com.restaurante.service;

import com.restaurante.dto.response.ComandaDetalleResponse;
import com.restaurante.dto.response.ComandaResponse;
import com.restaurante.entity.DetallePedido;
import com.restaurante.entity.Pedido;
import com.restaurante.entity.PedidoExtra;
import com.restaurante.exception.ResourceNotFoundException;
import com.restaurante.repository.DetallePedidoRepository;
import com.restaurante.repository.PedidoExtraRepository;
import com.restaurante.repository.PedidoRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CocinaService {
    private static final List<Pedido.Estado> ESTADOS_COCINA = List.of(
            Pedido.Estado.ENVIADO_COCINA,
            Pedido.Estado.EN_PREPARACION,
            Pedido.Estado.LISTO);

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private PedidoExtraRepository pedidoExtraRepository;

    @Transactional(readOnly = true)
    public List<ComandaResponse> listarComandas() {
        return pedidoRepository.findByEstadoIn(ESTADOS_COCINA).stream()
                .map(this::toComandaResponse)
                .collect(Collectors.toList());
    }

    public ComandaResponse iniciarPreparacion(Integer idPedido) {
        Pedido pedido = getPedido(idPedido);
        if (pedido.getEstado() != Pedido.Estado.ENVIADO_COCINA && pedido.getEstado() != Pedido.Estado.EN_PREPARACION) {
            throw new IllegalStateException("Solo se puede iniciar un pedido enviado a cocina.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (pedido.getFechaInicioPreparacion() == null) {
            pedido.setFechaInicioPreparacion(now);
        }
        pedido.setEstado(Pedido.Estado.EN_PREPARACION);
        detallePedidoRepository.findByPedidoIdPedido(idPedido).forEach(detalle -> {
            if (detalle.getEstadoCocina() == DetallePedido.EstadoCocina.PENDIENTE) {
                detalle.setEstadoCocina(DetallePedido.EstadoCocina.EN_PREPARACION);
                detalle.setFechaInicioPreparacion(now);
                detallePedidoRepository.save(detalle);
            }
        });
        return toComandaResponse(pedidoRepository.save(pedido));
    }

    public ComandaResponse finalizarPreparacion(Integer idPedido) {
        Pedido pedido = getPedido(idPedido);
        if (pedido.getEstado() != Pedido.Estado.EN_PREPARACION && pedido.getEstado() != Pedido.Estado.ENVIADO_COCINA) {
            throw new IllegalStateException("Solo se puede finalizar un pedido en preparación.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (pedido.getFechaInicioPreparacion() == null) {
            pedido.setFechaInicioPreparacion(now);
        }
        pedido.setFechaFinPreparacion(now);
        pedido.setTiempoRealMinutos((int) Duration.between(pedido.getFechaInicioPreparacion(), now).toMinutes());
        pedido.setEstado(Pedido.Estado.LISTO);
        detallePedidoRepository.findByPedidoIdPedido(idPedido).forEach(detalle -> {
            if (detalle.getFechaInicioPreparacion() == null) {
                detalle.setFechaInicioPreparacion(pedido.getFechaInicioPreparacion());
            }
            detalle.setFechaFinPreparacion(now);
            detalle.setTiempoRealMinutos((int) Duration.between(detalle.getFechaInicioPreparacion(), now).toMinutes());
            detalle.setEstadoCocina(DetallePedido.EstadoCocina.LISTO);
            detallePedidoRepository.save(detalle);
        });
        return toComandaResponse(pedidoRepository.save(pedido));
    }

    public ComandaDetalleResponse cambiarEstadoDetalle(Integer idDetalle, DetallePedido.EstadoCocina estado) {
        DetallePedido detalle = detallePedidoRepository.findById(idDetalle)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle de pedido no encontrado."));
        LocalDateTime now = LocalDateTime.now();
        if (estado == DetallePedido.EstadoCocina.EN_PREPARACION && detalle.getFechaInicioPreparacion() == null) {
            detalle.setFechaInicioPreparacion(now);
        }
        if (estado == DetallePedido.EstadoCocina.LISTO) {
            if (detalle.getFechaInicioPreparacion() == null) {
                detalle.setFechaInicioPreparacion(now);
            }
            detalle.setFechaFinPreparacion(now);
            detalle.setTiempoRealMinutos((int) Duration.between(detalle.getFechaInicioPreparacion(), now).toMinutes());
        }
        detalle.setEstadoCocina(estado);
        return toDetalleResponse(detallePedidoRepository.save(detalle));
    }

    private Pedido getPedido(Integer idPedido) {
        return pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado."));
    }

    private ComandaResponse toComandaResponse(Pedido pedido) {
        ComandaResponse response = new ComandaResponse();
        response.setIdPedido(pedido.getIdPedido());
        response.setEstado(pedido.getEstado() != null ? pedido.getEstado().name() : null);
        response.setFechaEnvioCocina(pedido.getFechaEnvioCocina());
        response.setFechaInicioPreparacion(pedido.getFechaInicioPreparacion());
        response.setFechaFinPreparacion(pedido.getFechaFinPreparacion());
        response.setTiempoEstimadoMinutos(pedido.getTiempoEstimadoMinutos());
        response.setTiempoRealMinutos(pedido.getTiempoRealMinutos());
        if (pedido.getMesa() != null) {
            response.setIdMesa(pedido.getMesa().getIdMesa());
            response.setNumeroMesa(pedido.getMesa().getNumero());
        }
        if (pedido.getCliente() != null) {
            response.setClienteNombre((pedido.getCliente().getNombre() + " " + pedido.getCliente().getApellido()).trim());
        }
        response.setDetalles(detallePedidoRepository.findByPedidoIdPedido(pedido.getIdPedido()).stream()
                .map(this::toDetalleResponse)
                .collect(Collectors.toList()));
        return response;
    }

    private ComandaDetalleResponse toDetalleResponse(DetallePedido detalle) {
        ComandaDetalleResponse response = new ComandaDetalleResponse();
        response.setIdDetallePedido(detalle.getIdDetallePedido());
        response.setCantidad(detalle.getCantidad());
        response.setObservacion(detalle.getObservacion());
        response.setEstadoCocina(detalle.getEstadoCocina() != null ? detalle.getEstadoCocina().name() : null);
        response.setTiempoEstimadoMinutos(detalle.getTiempoEstimadoMinutos());
        response.setTiempoRealMinutos(detalle.getTiempoRealMinutos());
        response.setFechaInicioPreparacion(detalle.getFechaInicioPreparacion());
        response.setFechaFinPreparacion(detalle.getFechaFinPreparacion());
        if (detalle.getProducto() != null) {
            response.setItemNombre(detalle.getProducto().getNombre());
        }
        if (detalle.getCombo() != null) {
            response.setItemNombre(detalle.getCombo().getNombre());
        }
        if (detalle.getVariante() != null) {
            response.setVarianteNombre(detalle.getVariante().getNombre());
        }
        List<String> extras = pedidoExtraRepository.findByDetallePedidoIdDetallePedido(detalle.getIdDetallePedido())
                .stream()
                .map(PedidoExtra::getExtra)
                .map(extra -> extra.getNombre())
                .collect(Collectors.toList());
        response.setExtras(extras);
        return response;
    }
}
