package com.restaurante.dto.mapper;

import com.restaurante.dto.response.RolResponse;
import com.restaurante.dto.response.PermisoResponse;
import com.restaurante.entity.Rol;
import com.restaurante.entity.Permiso;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class RolMapper {

    public RolResponse toResponse(Rol entity) {
        if (entity == null) return null;
        RolResponse response = new RolResponse();
        response.setIdRol(entity.getIdRol());
        response.setNombre(entity.getNombre());
        response.setDescripcion(entity.getDescripcion());
        if (entity.getEstado() != null) {
            response.setEstado(entity.getEstado().name());
        }
        if (entity.getPermisos() != null) {
            response.setPermisos(entity.getPermisos().stream()
                .map(this::toPermisoResponse)
                .collect(Collectors.toList()));
        } else {
            response.setPermisos(new ArrayList<>());
        }
        return response;
    }

    public PermisoResponse toPermisoResponse(Permiso entity) {
        if (entity == null) return null;
        PermisoResponse response = new PermisoResponse();
        response.setIdPermiso(entity.getIdPermiso());
        response.setNombre(entity.getNombre());
        response.setDescripcion(entity.getDescripcion());
        return response;
    }
}
