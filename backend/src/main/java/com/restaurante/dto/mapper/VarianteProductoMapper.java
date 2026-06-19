package com.restaurante.dto.mapper;

import com.restaurante.dto.request.VarianteProductoRequest;
import com.restaurante.dto.response.VarianteProductoResponse;
import com.restaurante.entity.VarianteProducto;
import org.springframework.stereotype.Component;

@Component
public class VarianteProductoMapper {

    public VarianteProductoResponse toResponse(VarianteProducto entity) {
        if (entity == null) return null;
        VarianteProductoResponse response = new VarianteProductoResponse();
        response.setIdVariante(entity.getIdVariante());
        response.setNombre(entity.getNombre());
        response.setDescripcion(entity.getDescripcion());
        response.setPrecioExtra(entity.getPrecioExtra());
        if (entity.getEstado() != null) {
            response.setEstado(entity.getEstado().name());
        }
        if (entity.getProducto() != null) {
            response.setIdProducto(entity.getProducto().getIdProducto());
            response.setNombreProducto(entity.getProducto().getNombre());
        }
        return response;
    }

    public VarianteProducto toEntity(VarianteProductoRequest request) {
        if (request == null) return null;
        VarianteProducto entity = new VarianteProducto();
        entity.setNombre(request.getNombre());
        entity.setDescripcion(request.getDescripcion());
        entity.setPrecioExtra(request.getPrecioExtra());
        if (request.getEstado() != null) {
            entity.setEstado(VarianteProducto.Estado.valueOf(request.getEstado().toUpperCase()));
        }
        return entity;
    }
}
