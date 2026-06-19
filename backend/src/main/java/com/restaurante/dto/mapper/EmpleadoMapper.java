package com.restaurante.dto.mapper;

import com.restaurante.dto.request.EmpleadoRequest;
import com.restaurante.dto.response.EmpleadoResponse;
import com.restaurante.entity.Empleado;
import org.springframework.stereotype.Component;

@Component
public class EmpleadoMapper {

    public EmpleadoResponse toResponse(Empleado entity) {
        if (entity == null) return null;
        EmpleadoResponse dto = new EmpleadoResponse();
        dto.setIdEmpleado(entity.getIdEmpleado());
        dto.setNombre(entity.getNombre());
        dto.setApellido(entity.getApellido());
        dto.setUsername(entity.getUsername());
        dto.setTelefono(entity.getTelefono());
        dto.setEmail(entity.getEmail());
        dto.setAvatarUrl(entity.getAvatarUrl());
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        if (entity.getRol() != null) {
            dto.setIdRol(entity.getRol().getIdRol());
            dto.setNombreRol(entity.getRol().getNombre());
        }
        return dto;
    }

    public Empleado toEntity(EmpleadoRequest request) {
        if (request == null) return null;
        Empleado entity = new Empleado();
        entity.setNombre(request.getNombre());
        entity.setApellido(request.getApellido());
        entity.setUsername(request.getUsername());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        entity.setAvatarUrl(request.getAvatarUrl());
        if (request.getEstado() != null) {
            entity.setEstado(Empleado.Estado.valueOf(request.getEstado()));
        }
        return entity;
    }
}
