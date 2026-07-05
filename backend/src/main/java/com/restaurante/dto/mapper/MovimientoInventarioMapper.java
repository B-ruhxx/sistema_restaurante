package com.restaurante.dto.mapper;

import com.restaurante.dto.response.MovimientoInventarioResponse;
import com.restaurante.entity.MovimientoInventario;
import org.springframework.stereotype.Component;

@Component
public class MovimientoInventarioMapper {

    public MovimientoInventarioResponse toResponse(MovimientoInventario entity) {
        if (entity == null) return null;
        MovimientoInventarioResponse response = new MovimientoInventarioResponse();
        response.setIdMovimiento(entity.getIdMovimiento());
        if (entity.getTipoRecurso() != null) {
            response.setTipoRecurso(entity.getTipoRecurso().name());
        }
        if (entity.getInsumo() != null) {
            response.setIdInsumo(entity.getInsumo().getIdInsumo());
            response.setNombreInsumo(entity.getInsumo().getNombre());
        }
        if (entity.getLoteInsumo() != null) {
            response.setIdLoteInsumo(entity.getLoteInsumo().getIdLoteInsumo());
            response.setFechaVencimientoLote(entity.getLoteInsumo().getFechaVencimiento());
        }
        if (entity.getProducto() != null) {
            response.setIdProducto(entity.getProducto().getIdProducto());
            response.setNombreProducto(entity.getProducto().getNombre());
        }
        if (entity.getLoteProducto() != null) {
            response.setIdLoteProducto(entity.getLoteProducto().getIdLoteProducto());
            response.setFechaVencimientoLote(entity.getLoteProducto().getFechaVencimiento());
        }
        if (entity.getTipoMovimiento() != null) {
            response.setTipoMovimiento(entity.getTipoMovimiento().name());
        }
        response.setReferenceType(entity.getReferenceType());
        response.setReferenceId(entity.getReferenceId());
        response.setCantidad(entity.getCantidad());
        response.setStockAnterior(entity.getStockAnterior());
        response.setStockNuevo(entity.getStockNuevo());
        response.setCostoUnitario(entity.getCostoUnitario());
        response.setSaldoValorizado(entity.getSaldoValorizado());
        response.setMotivo(entity.getMotivo());
        response.setFecha(entity.getFecha());
        if (entity.getEmpleado() != null) {
            response.setIdEmpleado(entity.getEmpleado().getIdEmpleado());
            response.setNombreEmpleado(entity.getEmpleado().getNombre() + " " + entity.getEmpleado().getApellido());
        }
        return response;
    }
}
