package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PedidoResponse {
    private Integer idPedido;
    private String empleadoNombre;
    private String clienteNombre;
    private Integer idCliente;
    private Integer idMesa;
    private String numeroMesa;
    private String estadoMesa;
    private String estado;
    private LocalDateTime fecha;
    private BigDecimal subtotal;
    private BigDecimal igv;
    private BigDecimal total;
    private LocalDateTime fechaEnvioCocina;
    private LocalDateTime fechaInicioPreparacion;
    private LocalDateTime fechaFinPreparacion;
    private Integer tiempoEstimadoMinutos;
    private Integer tiempoRealMinutos;
    private java.util.List<DetallePedidoResponse> detalles;

    public Integer getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Integer idPedido) {
        this.idPedido = idPedido;
    }

    public String getEmpleadoNombre() {
        return empleadoNombre;
    }

    public void setEmpleadoNombre(String empleadoNombre) {
        this.empleadoNombre = empleadoNombre;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public Integer getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(Integer idCliente) {
        this.idCliente = idCliente;
    }

    public Integer getIdMesa() {
        return idMesa;
    }

    public void setIdMesa(Integer idMesa) {
        this.idMesa = idMesa;
    }

    public String getNumeroMesa() {
        return numeroMesa;
    }

    public void setNumeroMesa(String numeroMesa) {
        this.numeroMesa = numeroMesa;
    }

    public String getEstadoMesa() {
        return estadoMesa;
    }

    public void setEstadoMesa(String estadoMesa) {
        this.estadoMesa = estadoMesa;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getIgv() {
        return igv;
    }

    public void setIgv(BigDecimal igv) {
        this.igv = igv;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public LocalDateTime getFechaEnvioCocina() {
        return fechaEnvioCocina;
    }

    public void setFechaEnvioCocina(LocalDateTime fechaEnvioCocina) {
        this.fechaEnvioCocina = fechaEnvioCocina;
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

    public java.util.List<DetallePedidoResponse> getDetalles() {
        return detalles;
    }

    public void setDetalles(java.util.List<DetallePedidoResponse> detalles) {
        this.detalles = detalles;
    }
}
