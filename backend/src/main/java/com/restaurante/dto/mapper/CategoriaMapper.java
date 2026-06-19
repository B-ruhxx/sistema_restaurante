package com.restaurante.dto.mapper;

import com.restaurante.dto.request.CategoriaRequest;
import com.restaurante.dto.response.CategoriaResponse;
import com.restaurante.entity.Categoria;
import org.springframework.stereotype.Component;

@Component
public class CategoriaMapper {

    public CategoriaResponse toResponse(Categoria entity) {
        if (entity == null) return null;
        CategoriaResponse response = new CategoriaResponse();
        response.setIdCategoria(entity.getIdCategoria());
        response.setNombre(entity.getNombre());
        response.setDescripcion(entity.getDescripcion());
        response.setImagenUrl(entity.getImagenUrl());
        if (entity.getEstado() != null) {
            response.setEstado(entity.getEstado().name());
        }
        return response;
    }

    public Categoria toEntity(CategoriaRequest request) {
        if (request == null) return null;
        Categoria entity = new Categoria();
        entity.setNombre(request.getNombre());
        entity.setDescripcion(request.getDescripcion());
        entity.setImagenUrl(request.getImagenUrl());
        if (request.getEstado() != null) {
            entity.setEstado(Categoria.Estado.valueOf(request.getEstado().toUpperCase()));
        }
        return entity;
    }
}
