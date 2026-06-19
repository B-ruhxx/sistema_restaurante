package com.restaurante.dto.mapper;

import com.restaurante.dto.request.InsumoRequest;
import com.restaurante.dto.response.InsumoResponse;
import com.restaurante.entity.Insumo;
import org.springframework.stereotype.Component;

@Component
public class InsumoMapper {

    public InsumoResponse toResponse(Insumo entity) {
        if (entity == null) return null;
        InsumoResponse dto = new InsumoResponse();
        dto.setIdInsumo(entity.getIdInsumo());
        dto.setNombre(entity.getNombre());
        dto.setUnidad(entity.getUnidad());
        dto.setStock(entity.getStock());
        dto.setStockMinimo(entity.getStockMinimo());
        dto.setCostoPromedio(entity.getCostoPromedio());
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        return dto;
    }

    public Insumo toEntity(InsumoRequest request) {
        if (request == null) return null;
        Insumo entity = new Insumo();
        entity.setNombre(request.getNombre());
        entity.setUnidad(request.getUnidad());
        entity.setStock(request.getStock());
        entity.setStockMinimo(request.getStockMinimo());
        if (request.getCostoPromedio() != null) {
            entity.setCostoPromedio(request.getCostoPromedio());
        }
        if (request.getEstado() != null) {
            entity.setEstado(Insumo.Estado.valueOf(request.getEstado()));
        }
        return entity;
    }
}
