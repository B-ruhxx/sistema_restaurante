package com.restaurante.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class ComandaDetalleResponse {
    private Integer idDetallePedido;
    private String itemNombre;
    private Integer cantidad;
    private String observacion;
    private List<String> extras;
    private String estadoCocina;
    private Integer tiempoEstimadoMinutos;
    private Integer tiempoRealMinutos;
    private LocalDateTime fechaInicioPreparacion;
    private LocalDateTime fechaFinPreparacion;

    public Integer getIdDetallePedido() {
        return idDetallePedido;
    }

    public void setIdDetallePedido(Integer idDetallePedido) {
        this.idDetallePedido = idDetallePedido;
    }

    public String getItemNombre() {
        return itemNombre;
    }

    public void setItemNombre(String itemNombre) {
        this.itemNombre = itemNombre;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public List<String> getExtras() {
        return extras;
    }

    public void setExtras(List<String> extras) {
        this.extras = extras;
    }

    public String getEstadoCocina() {
        return estadoCocina;
    }

    public void setEstadoCocina(String estadoCocina) {
        this.estadoCocina = estadoCocina;
    }

    public Integer getTiempoEstimadoMinutos() {
        return tiempoEstimadoMinutos;
    }

    public void setTiempoEstimadoMinutos(Integer tiempoEstimadoMinutos) {
        this.tiempoEstimadoMinutos = tiempoEstimadoMinutos;
    }

    public Integer getTiempoRealMinutos() {
        return tiempoRealMinutos;
    }

    public void setTiempoRealMinutos(Integer tiempoRealMinutos) {
        this.tiempoRealMinutos = tiempoRealMinutos;
    }

    public LocalDateTime getFechaInicioPreparacion() {
        return fechaInicioPreparacion;
    }

    public void setFechaInicioPreparacion(LocalDateTime fechaInicioPreparacion) {
        this.fechaInicioPreparacion = fechaInicioPreparacion;
    }

    public LocalDateTime getFechaFinPreparacion() {
        return fechaFinPreparacion;
    }

    public void setFechaFinPreparacion(LocalDateTime fechaFinPreparacion) {
        this.fechaFinPreparacion = fechaFinPreparacion;
    }
}
