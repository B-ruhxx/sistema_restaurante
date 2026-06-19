package com.restaurante.dto.mapper;

import com.restaurante.dto.request.MetodoPagoRequest;
import com.restaurante.dto.response.MetodoPagoResponse;
import com.restaurante.entity.MetodoPago;
import org.springframework.stereotype.Component;

@Component
public class MetodoPagoMapper {

    public MetodoPagoResponse toResponse(MetodoPago entity) {
        if (entity == null) return null;
        MetodoPagoResponse response = new MetodoPagoResponse();
        response.setIdMetodoPago(entity.getIdMetodoPago());
        response.setNombre(entity.getNombre());
        response.setRequiereOperacion(entity.getRequiereOperacion());
        if (entity.getEstado() != null) {
            response.setEstado(entity.getEstado().name());
        }
        return response;
    }

    public MetodoPago toEntity(MetodoPagoRequest request) {
        if (request == null) return null;
        MetodoPago entity = new MetodoPago();
        entity.setNombre(request.getNombre());
        if (request.getRequiereOperacion() != null) {
            entity.setRequiereOperacion(request.getRequiereOperacion());
        }
        if (request.getEstado() != null) {
            entity.setEstado(MetodoPago.Estado.valueOf(request.getEstado().toUpperCase()));
        }
        return entity;
    }
}
