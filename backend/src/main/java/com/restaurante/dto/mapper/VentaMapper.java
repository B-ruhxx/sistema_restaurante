package com.restaurante.dto.mapper;

import com.restaurante.dto.response.DetalleVentaResponse;
import com.restaurante.dto.response.VentaPagoResponse;
import com.restaurante.dto.response.VentaResponse;
import com.restaurante.entity.DetalleVenta;
import com.restaurante.entity.Venta;
import com.restaurante.entity.VentaPago;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class VentaMapper {

    public VentaResponse toResponse(Venta entity) {
        if (entity == null) return null;
        VentaResponse dto = new VentaResponse();
        dto.setIdVenta(entity.getIdVenta());
        dto.setComprobante(entity.getComprobante());
        dto.setFecha(entity.getFecha());
        dto.setSubtotal(entity.getSubtotal());
        dto.setIgv(entity.getIgv());
        dto.setTotal(entity.getTotal());
        if (entity.getTipoComprobante() != null) {
            dto.setTipoComprobante(entity.getTipoComprobante().name());
        }
        dto.setSerie(entity.getSerie());
        dto.setNumero(entity.getNumero());
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        if (entity.getPedido() != null) {
            dto.setIdPedido(entity.getPedido().getIdPedido());
        }
        if (entity.getEmpleado() != null) {
            dto.setCajeroNombre(entity.getEmpleado().getNombre() + " " + entity.getEmpleado().getApellido());
        }
        if (entity.getCaja() != null) {
            dto.setIdCaja(entity.getCaja().getIdCaja());
        }
        return dto;
    }

    public VentaResponse toResponse(Venta entity, List<DetalleVenta> detalles, List<VentaPago> pagos) {
        if (entity == null) return null;
        VentaResponse dto = toResponse(entity);
        if (detalles != null) {
            dto.setDetalles(detalles.stream()
                .map(this::toDetalleResponse)
                .collect(Collectors.toList()));
        } else {
            dto.setDetalles(new ArrayList<>());
        }
        if (pagos != null) {
            dto.setPagos(pagos.stream()
                .map(this::toPagoResponse)
                .collect(Collectors.toList()));
        } else {
            dto.setPagos(new ArrayList<>());
        }
        return dto;
    }

    public DetalleVentaResponse toDetalleResponse(DetalleVenta entity) {
        if (entity == null) return null;
        DetalleVentaResponse dto = new DetalleVentaResponse();
        dto.setIdDetalleVenta(entity.getIdDetalle());
        dto.setCantidad(entity.getCantidad());
        dto.setPrecioUnitario(entity.getPrecioUnitario());
        dto.setSubtotal(entity.getSubtotal());
        if (entity.getProducto() != null) {
            dto.setIdProducto(entity.getProducto().getIdProducto());
            dto.setNombreProducto(entity.getProducto().getNombre());
        }
        if (entity.getCombo() != null) {
            dto.setIdCombo(entity.getCombo().getIdCombo());
            dto.setNombreCombo(entity.getCombo().getNombre());
        }
        return dto;
    }

    public VentaPagoResponse toPagoResponse(VentaPago entity) {
        if (entity == null) return null;
        VentaPagoResponse dto = new VentaPagoResponse();
        dto.setIdVentaPago(entity.getIdVentaPago());
        dto.setMonto(entity.getMonto());
        dto.setReferencia(entity.getReferencia());
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        if (entity.getMetodoPago() != null) {
            dto.setIdMetodoPago(entity.getMetodoPago().getIdMetodoPago());
            dto.setNombreMetodoPago(entity.getMetodoPago().getNombre());
        }
        return dto;
    }
}
