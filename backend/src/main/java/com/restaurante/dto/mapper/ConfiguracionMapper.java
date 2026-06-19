package com.restaurante.dto.mapper;

import com.restaurante.dto.request.ConfiguracionRequest;
import com.restaurante.dto.response.ConfiguracionResponse;
import com.restaurante.entity.ConfiguracionEmpresa;
import org.springframework.stereotype.Component;

@Component
public class ConfiguracionMapper {

    public ConfiguracionResponse toResponse(ConfiguracionEmpresa entity) {
        if (entity == null) return null;
        ConfiguracionResponse response = new ConfiguracionResponse();
        response.setIdConfiguracion(entity.getIdConfiguracion());
        response.setNombreEmpresa(entity.getNombreEmpresa());
        response.setRazonSocial(entity.getRazonSocial());
        response.setRuc(entity.getRuc());
        response.setLogoUrl(entity.getLogoUrl());
        response.setDireccion(entity.getDireccion());
        response.setTelefono(entity.getTelefono());
        response.setEmail(entity.getEmail());
        response.setMoneda(entity.getMoneda());
        response.setIgv(entity.getIgv());
        response.setSerieBoleta(entity.getSerieBoleta());
        response.setSerieFactura(entity.getSerieFactura());
        return response;
    }

    public ConfiguracionEmpresa toEntity(ConfiguracionRequest request) {
        if (request == null) return null;
        ConfiguracionEmpresa entity = new ConfiguracionEmpresa();
        entity.setNombreEmpresa(request.getNombreEmpresa());
        entity.setRazonSocial(request.getRazonSocial());
        entity.setRuc(request.getRuc());
        entity.setLogoUrl(request.getLogoUrl());
        entity.setDireccion(request.getDireccion());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        if (request.getMoneda() != null) {
            entity.setMoneda(request.getMoneda());
        }
        if (request.getIgv() != null) {
            entity.setIgv(request.getIgv());
        }
        entity.setSerieBoleta(request.getSerieBoleta());
        entity.setSerieFactura(request.getSerieFactura());
        return entity;
    }
}
