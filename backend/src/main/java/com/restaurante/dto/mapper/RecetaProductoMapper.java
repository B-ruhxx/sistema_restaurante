package com.restaurante.dto.mapper;

import com.restaurante.dto.response.RecetaProductoResponse;
import com.restaurante.entity.RecetaProducto;
import org.springframework.stereotype.Component;

@Component
public class RecetaProductoMapper {

    public RecetaProductoResponse toResponse(RecetaProducto entity) {
        if (entity == null) return null;
        RecetaProductoResponse response = new RecetaProductoResponse();
        response.setIdReceta(entity.getIdReceta());
        response.setCantidad(entity.getCantidad());
        if (entity.getProducto() != null) {
            response.setIdProducto(entity.getProducto().getIdProducto());
            response.setNombreProducto(entity.getProducto().getNombre());
        }
        if (entity.getInsumo() != null) {
            response.setIdInsumo(entity.getInsumo().getIdInsumo());
            response.setNombreInsumo(entity.getInsumo().getNombre());
            if (entity.getInsumo().getUnidad() != null) {
                response.setUnidadMedidaInsumo(entity.getInsumo().getUnidad());
            }
        }
        return response;
    }
}
