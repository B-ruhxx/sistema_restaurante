package com.restaurante.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class ComandaResponse {
    private Integer idPedido;
    private String estado;
    private Integer idMesa;
    private String numeroMesa;
    private String clienteNombre;
    private LocalDateTime fechaEnvioCocina;
    private LocalDateTime fechaInicioPreparacion;
    private LocalDateTime fechaFinPreparacion;
    private Integer tiempoEstimadoMinutos;
    private Integer tiempoRealMinutos;
    private List<ComandaDetalleResponse> detalles;

    public Integer getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Integer idPedido) {
        this.idPedido = idPedido;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
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

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
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

    public List<ComandaDetalleResponse> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<ComandaDetalleResponse> detalles) {
        this.detalles = detalles;
    }
}
