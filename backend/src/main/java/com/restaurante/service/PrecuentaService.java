package com.restaurante.service;

import com.restaurante.dto.mapper.PedidoMapper;
import com.restaurante.dto.mapper.PrecuentaMapper;
import com.restaurante.dto.response.DetallePedidoResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.dto.response.PrecuentaResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Mesa;
import com.restaurante.entity.Pedido;
import com.restaurante.entity.PedidoExtra;
import com.restaurante.entity.Precuenta;
import com.restaurante.exception.ResourceNotFoundException;
import com.restaurante.repository.DetallePedidoRepository;
import com.restaurante.repository.PedidoExtraRepository;
import com.restaurante.repository.PedidoRepository;
import com.restaurante.repository.PrecuentaRepository;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PrecuentaService {
    @Autowired
    private PrecuentaRepository precuentaRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private PedidoExtraRepository pedidoExtraRepository;

    @Autowired
    private PedidoMapper pedidoMapper;

    @Autowired
    private PrecuentaMapper precuentaMapper;

    @Autowired
    private PedidoService pedidoService;

    public PrecuentaResponse emitirPrecuenta(Integer idPedido, Empleado empleado) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado."));

        if (!detallePedidoRepository.existsByPedidoIdPedido(idPedido)) {
            throw new IllegalArgumentException("No se puede emitir precuenta para un pedido vacío.");
        }
        if (pedido.getEstado() == Pedido.Estado.CANCELADO || pedido.getEstado() == Pedido.Estado.CERRADO) {
            throw new IllegalStateException("No se puede emitir precuenta para un pedido cancelado o pagado.");
        }
        if (pedido.getEstado() == Pedido.Estado.EN_COCINA) {
            throw new IllegalStateException("No se puede emitir precuenta mientras el pedido está en cocina.");
        }

        pedidoService.recalcularTotales(pedido);
        pedidoService.cambiarEstadoInterno(pedido, Pedido.Estado.CUENTA, empleado);
        if (pedido.getMesa() != null) {
            pedido.getMesa().setEstado(Mesa.Estado.CUENTA);
        }

        Precuenta precuenta = new Precuenta();
        precuenta.setPedido(pedido);
        precuenta.setEmitidoPor(empleado);
        precuenta.setNumero(generarNumero());
        precuenta.setVersionPedido(pedido.getVersion());
        precuenta.setSubtotal(pedido.getSubtotal());
        precuenta.setIgv(pedido.getIgv());
        precuenta.setTotal(pedido.getTotal());
        precuenta.setEstado(Precuenta.Estado.EMITIDA);

        return map(precuentaRepository.save(precuenta));
    }

    @Transactional(readOnly = true)
    public PrecuentaResponse obtener(Integer idPrecuenta) {
        return map(precuentaRepository.findById(idPrecuenta)
                .orElseThrow(() -> new ResourceNotFoundException("Precuenta no encontrada.")));
    }

    @Transactional(readOnly = true)
    public List<PrecuentaResponse> obtenerPorPedido(Integer idPedido) {
        return precuentaRepository.findByPedidoIdPedidoOrderByFechaEmisionDesc(idPedido).stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    public void marcarConvertida(Pedido pedido) {
        precuentaRepository.findFirstByPedidoIdPedidoOrderByFechaEmisionDesc(pedido.getIdPedido())
                .ifPresent(precuenta -> {
                    precuenta.setEstado(Precuenta.Estado.CONVERTIDA_VENTA);
                    precuentaRepository.save(precuenta);
                });
    }

    public PedidoResponse reabrirPedidoPorAdicion(Integer idPedido, Empleado empleado) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado."));
        if (pedido.getEstado() != Pedido.Estado.CUENTA) {
            throw new IllegalStateException("Solo se puede reabrir un pedido en estado CUENTA.");
        }

        Precuenta precuenta = precuentaRepository.findFirstByPedidoIdPedidoOrderByFechaEmisionDesc(idPedido)
                .orElseThrow(() -> new IllegalStateException("No existe precuenta emitida para invalidar."));
        if (precuenta.getEstado() != Precuenta.Estado.EMITIDA) {
            throw new IllegalStateException("La última precuenta no está emitida y no puede invalidarse por adición.");
        }

        precuenta.setEstado(Precuenta.Estado.INVALIDADA_POR_ADICION);
        precuenta.setFechaInvalidacion(LocalDateTime.now());
        precuenta.setMotivoInvalidacion("INVALIDADA_POR_ADICION");
        precuentaRepository.save(precuenta);

        pedidoService.cambiarEstadoInterno(pedido, Pedido.Estado.EN_COCINA, empleado);
        if (pedido.getMesa() != null) {
            pedido.getMesa().setEstado(Mesa.Estado.EN_COCINA);
        }
        return mapPedido(pedidoRepository.save(pedido));
    }

    private PrecuentaResponse map(Precuenta precuenta) {
        List<DetallePedidoResponse> detalles = detallePedidoRepository
                .findByPedidoIdPedido(precuenta.getPedido().getIdPedido())
                .stream()
                .map(det -> {
                    List<PedidoExtra> extras = pedidoExtraRepository.findByDetallePedidoIdDetallePedido(det.getIdDetallePedido());
                    return pedidoMapper.toDetalleResponse(det, extras);
                })
                .collect(Collectors.toList());
        return precuentaMapper.toResponse(precuenta, detalles);
    }

    private PedidoResponse mapPedido(Pedido pedido) {
        List<DetallePedidoResponse> detalles = detallePedidoRepository
                .findByPedidoIdPedido(pedido.getIdPedido())
                .stream()
                .map(det -> {
                    List<PedidoExtra> extras = pedidoExtraRepository.findByDetallePedidoIdDetallePedido(det.getIdDetallePedido());
                    return pedidoMapper.toDetalleResponse(det, extras);
                })
                .collect(Collectors.toList());
        return pedidoMapper.toResponse(pedido, detalles);
    }

    private String generarNumero() {
        return "PRE-" + System.currentTimeMillis();
    }
}
