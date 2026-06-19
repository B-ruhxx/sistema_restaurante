package com.restaurante.dto.mapper;

import com.restaurante.dto.request.ProveedorRequest;
import com.restaurante.dto.response.ProveedorResponse;
import com.restaurante.entity.Proveedor;
import org.springframework.stereotype.Component;

@Component
public class ProveedorMapper {

    public ProveedorResponse toResponse(Proveedor entity) {
        if (entity == null) return null;
        ProveedorResponse response = new ProveedorResponse();
        response.setIdProveedor(entity.getIdProveedor());
        response.setRazonSocial(entity.getRazonSocial());
        response.setNombreComercial(entity.getNombreComercial());
        response.setRuc(entity.getRuc());
        response.setTelefono(entity.getTelefono());
        response.setEmail(entity.getEmail());
        response.setDireccion(entity.getDireccion());
        response.setContactoPrincipal(entity.getContactoPrincipal());
        if (entity.getEstado() != null) {
            response.setEstado(entity.getEstado().name());
        }
        return response;
    }

    public Proveedor toEntity(ProveedorRequest request) {
        if (request == null) return null;
        Proveedor entity = new Proveedor();
        entity.setRazonSocial(request.getRazonSocial());
        entity.setNombreComercial(request.getNombreComercial());
        entity.setRuc(request.getRuc());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        entity.setDireccion(request.getDireccion());
        entity.setContactoPrincipal(request.getContactoPrincipal());
        if (request.getEstado() != null) {
            entity.setEstado(Proveedor.Estado.valueOf(request.getEstado().toUpperCase()));
        }
        return entity;
    }
}
