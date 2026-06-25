package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class DetallePedidoResponse {
    private Integer idDetallePedido;
    private Integer idProducto;
    private String nombreProducto;
    private Integer idCombo;
    private String nombreCombo;
    private Integer idVariante;
    private String nombreVariante;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private String observacion;
    private String estadoCocina;
    private Integer tiempoEstimadoMinutos;
    private Integer tiempoRealMinutos;
    private LocalDateTime fechaInicioPreparacion;
    private LocalDateTime fechaFinPreparacion;
    private List<ExtraProductoResponse> extras;

    public Integer getIdDetallePedido() {
        return idDetallePedido;
    }

    public void setIdDetallePedido(Integer idDetallePedido) {
        this.idDetallePedido = idDetallePedido;
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public Integer getIdCombo() {
        return idCombo;
    }

    public void setIdCombo(Integer idCombo) {
        this.idCombo = idCombo;
    }

    public String getNombreCombo() {
        return nombreCombo;
    }

    public void setNombreCombo(String nombreCombo) {
        this.nombreCombo = nombreCombo;
    }

    public Integer getIdVariante() {
        return idVariante;
    }

    public void setIdVariante(Integer idVariante) {
        this.idVariante = idVariante;
    }

    public String getNombreVariante() {
        return nombreVariante;
    }

    public void setNombreVariante(String nombreVariante) {
        this.nombreVariante = nombreVariante;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
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

    public List<ExtraProductoResponse> getExtras() {
        return extras;
    }

    public void setExtras(List<ExtraProductoResponse> extras) {
        this.extras = extras;
    }
}
