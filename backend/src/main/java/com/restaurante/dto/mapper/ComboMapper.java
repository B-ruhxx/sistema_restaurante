package com.restaurante.dto.mapper;

import com.restaurante.dto.request.ComboRequest;
import com.restaurante.dto.response.ComboResponse;
import com.restaurante.entity.ComboDetalle;
import com.restaurante.entity.ComboProducto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ComboMapper {

    public ComboResponse toResponse(ComboProducto entity, List<ComboDetalle> detalles) {
        if (entity == null) return null;
        ComboResponse response = new ComboResponse();
        response.setIdCombo(entity.getIdCombo());
        response.setNombre(entity.getNombre());
        response.setDescripcion(entity.getDescripcion());
        response.setPrecio(entity.getPrecio());
        if (entity.getEstado() != null) {
            response.setEstado(entity.getEstado().name());
        }
        if (detalles != null) {
            response.setDetalles(detalles.stream()
                .map(this::toDetalleResponse)
                .collect(Collectors.toList()));
        } else {
            response.setDetalles(new ArrayList<>());
        }
        return response;
    }

    public ComboResponse.ComboDetalleResponse toDetalleResponse(ComboDetalle detalle) {
        if (detalle == null) return null;
        ComboResponse.ComboDetalleResponse dto = new ComboResponse.ComboDetalleResponse();
        dto.setIdComboDetalle(detalle.getIdComboDetalle());
        dto.setCantidad(detalle.getCantidad());
        if (detalle.getProducto() != null) {
            dto.setIdProducto(detalle.getProducto().getIdProducto());
            dto.setNombreProducto(detalle.getProducto().getNombre());
            dto.setPrecioProducto(detalle.getProducto().getPrecio());
        }
        return dto;
    }

    public ComboProducto toEntity(ComboRequest request) {
        if (request == null) return null;
        ComboProducto entity = new ComboProducto();
        entity.setNombre(request.getNombre());
        entity.setDescripcion(request.getDescripcion());
        entity.setPrecio(request.getPrecio());
        if (request.getEstado() != null) {
            entity.setEstado(ComboProducto.Estado.valueOf(request.getEstado().toUpperCase()));
        }
        return entity;
    }
}
