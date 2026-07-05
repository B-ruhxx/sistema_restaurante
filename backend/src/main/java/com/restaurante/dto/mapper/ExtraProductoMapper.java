package com.restaurante.dto.mapper;

import com.restaurante.dto.request.ExtraProductoRequest;
import com.restaurante.dto.response.ExtraProductoResponse;
import com.restaurante.entity.ExtraProducto;
import org.springframework.stereotype.Component;

@Component
public class ExtraProductoMapper {

    public ExtraProductoResponse toResponse(ExtraProducto entity) {
        if (entity == null) return null;
        ExtraProductoResponse response = new ExtraProductoResponse();
        response.setIdExtra(entity.getIdExtra());
        response.setNombre(entity.getNombre());
        response.setPrecio(entity.getPrecio());
        response.setCantidadConsumida(entity.getCantidadConsumida());
        if (entity.getInsumo() != null) {
            response.setIdInsumo(entity.getInsumo().getIdInsumo());
            response.setNombreInsumo(entity.getInsumo().getNombre());
            response.setUnidadMedidaInsumo(entity.getInsumo().getUnidad());
        }
        if (entity.getEstado() != null) {
            response.setEstado(entity.getEstado().name());
        }
        return response;
    }

    public ExtraProducto toEntity(ExtraProductoRequest request) {
        if (request == null) return null;
        ExtraProducto entity = new ExtraProducto();
        entity.setNombre(request.getNombre());
        entity.setPrecio(request.getPrecio());
        entity.setCantidadConsumida(request.getCantidadConsumida());
        if (request.getEstado() != null) {
            entity.setEstado(ExtraProducto.Estado.valueOf(request.getEstado().toUpperCase()));
        }
        return entity;
    }
}
