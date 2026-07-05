package com.restaurante.dto.mapper;

import com.restaurante.dto.request.MesaRequest;
import com.restaurante.dto.response.MesaResponse;
import com.restaurante.entity.Mesa;
import org.springframework.stereotype.Component;

@Component
public class MesaMapper {
    public Mesa toEntity(MesaRequest request) {
        Mesa mesa = new Mesa();
        apply(request, mesa);
        return mesa;
    }

    public void apply(MesaRequest request, Mesa mesa) {
        mesa.setNumero(request.getNumero());
        mesa.setCapacidad(request.getCapacidad() != null ? request.getCapacidad() : 4);
        mesa.setUbicacion(request.getUbicacion());
    }

    public MesaResponse toResponse(Mesa mesa) {
        MesaResponse response = new MesaResponse();
        response.setIdMesa(mesa.getIdMesa());
        response.setNumero(mesa.getNumero());
        response.setCapacidad(mesa.getCapacidad());
        response.setUbicacion(mesa.getUbicacion());
        response.setEstado(mesa.getEstado() != null ? mesa.getEstado().name() : null);
        return response;
    }
}
