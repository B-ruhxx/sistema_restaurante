package com.restaurante.dto.mapper;

import com.restaurante.dto.response.CajaResponse;
import com.restaurante.dto.response.MovimientoCajaResponse;
import com.restaurante.entity.Caja;
import com.restaurante.entity.MovimientoCaja;
import org.springframework.stereotype.Component;

@Component
public class CajaMapper {

    public CajaResponse toResponse(Caja entity) {
        if (entity == null) return null;
        CajaResponse response = new CajaResponse();
        response.setIdCaja(entity.getIdCaja());
        response.setEstado(entity.getEstado() != null ? entity.getEstado().name() : null);
        response.setMontoApertura(entity.getMontoApertura());
        response.setMontoCierre(entity.getMontoCierre());
        response.setMontoSistema(entity.getMontoSistema());
        response.setDiferencia(entity.getDiferencia());
        response.setObservacion(entity.getObservacion());
        response.setFechaApertura(entity.getFechaApertura());
        response.setFechaCierre(entity.getFechaCierre());
        if (entity.getEmpleado() != null) {
            response.setIdEmpleado(entity.getEmpleado().getIdEmpleado());
            response.setNombreEmpleado(entity.getEmpleado().getNombre() + " " + entity.getEmpleado().getApellido());
        }
        return response;
    }

    public MovimientoCajaResponse toResponse(MovimientoCaja entity) {
        if (entity == null) return null;
        MovimientoCajaResponse response = new MovimientoCajaResponse();
        response.setIdMovimiento(entity.getIdMovimiento());
        if (entity.getCaja() != null) {
            response.setIdCaja(entity.getCaja().getIdCaja());
        }
        if (entity.getTipo() != null) {
            response.setTipo(entity.getTipo().name());
        }
        response.setConcepto(entity.getConcepto());
        response.setMonto(entity.getMonto());
        response.setReferenceType(entity.getReferenceType());
        response.setReferenceId(entity.getReferenceId());
        response.setComprobante(entity.getComprobante());
        if (entity.getEmpleado() != null) {
            response.setIdEmpleado(entity.getEmpleado().getIdEmpleado());
            response.setNombreEmpleado(entity.getEmpleado().getNombre() + " " + entity.getEmpleado().getApellido());
        }
        response.setFecha(entity.getFecha());
        return response;
    }
}
