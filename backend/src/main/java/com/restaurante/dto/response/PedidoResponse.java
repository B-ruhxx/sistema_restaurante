package com.restaurante.dto.response;

import java.time.LocalDateTime;

public class PedidoResponse {
    private Integer idPedido;
    private String empleadoNombre;
    private String clienteNombre;
    private Integer idCliente;
    private String estado;
    private LocalDateTime fecha;
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

    public java.util.List<DetallePedidoResponse> getDetalles() {
        return detalles;
    }

    public void setDetalles(java.util.List<DetallePedidoResponse> detalles) {
        this.detalles = detalles;
    }
}
