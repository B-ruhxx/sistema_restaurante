package com.restaurante.dto.response;

public class MetodoPagoResponse {
    private Integer idMetodoPago;
    private String nombre;
    private Boolean requiereOperacion;
    private String estado;

    public Integer getIdMetodoPago() {
        return idMetodoPago;
    }

    public void setIdMetodoPago(Integer idMetodoPago) {
        this.idMetodoPago = idMetodoPago;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Boolean getRequiereOperacion() {
        return requiereOperacion;
    }

    public void setRequiereOperacion(Boolean requiereOperacion) {
        this.requiereOperacion = requiereOperacion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
