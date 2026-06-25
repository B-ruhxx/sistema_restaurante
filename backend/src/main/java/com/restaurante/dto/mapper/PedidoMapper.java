package com.restaurante.dto.mapper;

import com.restaurante.dto.response.DetallePedidoResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.entity.DetallePedido;
import com.restaurante.entity.Pedido;
import com.restaurante.entity.PedidoExtra;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class PedidoMapper {

    @Autowired
    private ExtraProductoMapper extraProductoMapper;

    public PedidoResponse toResponse(Pedido entity) {
        if (entity == null) return null;
        PedidoResponse dto = new PedidoResponse();
        dto.setIdPedido(entity.getIdPedido());
        if (entity.getEmpleado() != null) {
            dto.setEmpleadoNombre(entity.getEmpleado().getNombre() + " " + entity.getEmpleado().getApellido());
        }
        if (entity.getCliente() != null) {
            dto.setClienteNombre(entity.getCliente().getNombre() + " " + entity.getCliente().getApellido());
            dto.setIdCliente(entity.getCliente().getIdCliente());
        }
        if (entity.getMesa() != null) {
            dto.setIdMesa(entity.getMesa().getIdMesa());
            dto.setNumeroMesa(entity.getMesa().getNumero());
            dto.setEstadoMesa(entity.getMesa().getEstado() != null ? entity.getMesa().getEstado().name() : null);
        }
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        dto.setFecha(entity.getFecha());
        dto.setSubtotal(entity.getSubtotal());
        dto.setIgv(entity.getIgv());
        dto.setTotal(entity.getTotal());
        dto.setFechaEnvioCocina(entity.getFechaEnvioCocina());
        dto.setFechaInicioPreparacion(entity.getFechaInicioPreparacion());
        dto.setFechaFinPreparacion(entity.getFechaFinPreparacion());
        dto.setTiempoEstimadoMinutos(entity.getTiempoEstimadoMinutos());
        dto.setTiempoRealMinutos(entity.getTiempoRealMinutos());
        return dto;
    }

    public PedidoResponse toResponse(Pedido entity, List<DetallePedidoResponse> detalles) {
        if (entity == null) return null;
        PedidoResponse dto = toResponse(entity);
        dto.setDetalles(detalles);
        return dto;
    }

    public DetallePedidoResponse toDetalleResponse(DetallePedido entity, List<PedidoExtra> extras) {
        if (entity == null) return null;
        DetallePedidoResponse dto = new DetallePedidoResponse();
        dto.setIdDetallePedido(entity.getIdDetallePedido());
        dto.setCantidad(entity.getCantidad());
        dto.setPrecioUnitario(entity.getPrecioUnitario());
        dto.setSubtotal(entity.getSubtotal());
        dto.setObservacion(entity.getObservacion());
        dto.setEstadoCocina(entity.getEstadoCocina() != null ? entity.getEstadoCocina().name() : null);
        dto.setTiempoEstimadoMinutos(entity.getTiempoEstimadoMinutos());
        dto.setTiempoRealMinutos(entity.getTiempoRealMinutos());
        dto.setFechaInicioPreparacion(entity.getFechaInicioPreparacion());
        dto.setFechaFinPreparacion(entity.getFechaFinPreparacion());
        if (entity.getProducto() != null) {
            dto.setIdProducto(entity.getProducto().getIdProducto());
            dto.setNombreProducto(entity.getProducto().getNombre());
        }
        if (entity.getCombo() != null) {
            dto.setIdCombo(entity.getCombo().getIdCombo());
            dto.setNombreCombo(entity.getCombo().getNombre());
        }
        if (entity.getVariante() != null) {
            dto.setIdVariante(entity.getVariante().getIdVariante());
            dto.setNombreVariante(entity.getVariante().getNombre());
        }
        if (extras != null) {
            dto.setExtras(extras.stream()
                .map(pe -> extraProductoMapper.toResponse(pe.getExtra()))
                .collect(Collectors.toList()));
        } else {
            dto.setExtras(new ArrayList<>());
        }
        return dto;
    }
}
