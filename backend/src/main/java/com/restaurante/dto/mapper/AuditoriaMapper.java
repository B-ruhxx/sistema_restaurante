package com.restaurante.dto.mapper;

import com.restaurante.dto.response.AuditoriaResponse;
import com.restaurante.entity.Auditoria;
import org.springframework.stereotype.Component;

@Component
public class AuditoriaMapper {

    public AuditoriaResponse toResponse(Auditoria entity) {
        if (entity == null) return null;
        AuditoriaResponse response = new AuditoriaResponse();
        response.setIdAuditoria(entity.getIdAuditoria());
        response.setTablaAfectada(entity.getTablaAfectada());
        if (entity.getAccion() != null) {
            response.setAccion(entity.getAccion().name());
        }
        response.setIdRegistro(entity.getIdRegistro());
        if (entity.getEmpleado() != null) {
            response.setIdEmpleado(entity.getEmpleado().getIdEmpleado());
            response.setNombreEmpleado(entity.getEmpleado().getNombre() + " " + entity.getEmpleado().getApellido());
        }
        response.setDatosAnteriores(entity.getDatosAnteriores());
        response.setDatosNuevos(entity.getDatosNuevos());
        response.setFechaEvento(entity.getFechaEvento());
        return response;
    }
}
