package com.restaurante.dto.mapper;

import com.restaurante.dto.response.CompraResponse;
import com.restaurante.dto.response.DetalleCompraResponse;
import com.restaurante.entity.CompraInsumo;
import com.restaurante.entity.DetalleCompraInsumo;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CompraMapper {

    public CompraResponse toResponse(CompraInsumo entity) {
        if (entity == null) return null;
        CompraResponse dto = new CompraResponse();
        dto.setIdCompra(entity.getIdCompra());
        dto.setCodigoCompra(entity.getCodigoCompra());
        if (entity.getProveedor() != null) {
            dto.setIdProveedor(entity.getProveedor().getIdProveedor());
            dto.setProveedorNombre(entity.getProveedor().getRazonSocial());
        }
        if (entity.getEmpleado() != null) {
            dto.setEmpleadoNombre(entity.getEmpleado().getNombre() + " " + entity.getEmpleado().getApellido());
        }
        dto.setSubtotal(entity.getSubtotal());
        dto.setIgv(entity.getIgv());
        dto.setTotal(entity.getTotal());
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        dto.setFecha(entity.getFecha());
        dto.setObservacion(entity.getObservacion());
        return dto;
    }

    public CompraResponse toResponse(CompraInsumo entity, List<DetalleCompraInsumo> detalles) {
        if (entity == null) return null;
        CompraResponse dto = toResponse(entity);
        if (detalles != null) {
            dto.setDetalles(detalles.stream()
                .map(this::toDetalleResponse)
                .collect(Collectors.toList()));
        } else {
            dto.setDetalles(new ArrayList<>());
        }
        return dto;
    }

    public DetalleCompraResponse toDetalleResponse(DetalleCompraInsumo entity) {
        if (entity == null) return null;
        DetalleCompraResponse dto = new DetalleCompraResponse();
        dto.setIdDetalleCompra(entity.getIdDetalleCompra());
        dto.setCantidad(entity.getCantidad());
        dto.setPrecioUnitario(entity.getPrecioUnitario());
        dto.setSubtotal(entity.getSubtotal());
        dto.setNumeroLote(entity.getNumeroLote());
        dto.setFechaVencimiento(entity.getFechaVencimiento());
        if (entity.getInsumo() != null) {
            dto.setTipoRecurso("INSUMO");
            dto.setIdInsumo(entity.getInsumo().getIdInsumo());
            dto.setNombreInsumo(entity.getInsumo().getNombre());
            dto.setUnidadInsumo(entity.getInsumo().getUnidad());
        }
        if (entity.getProducto() != null) {
            dto.setTipoRecurso("PRODUCTO");
            dto.setIdProducto(entity.getProducto().getIdProducto());
            dto.setNombreProducto(entity.getProducto().getNombre());
            dto.setSkuProducto(entity.getProducto().getSku());
        }
        return dto;
    }
}
