package com.restaurante.dto.response;

public class MetodoPagoResponse {
    private Integer idMetodoPago;
    private String nombre;
    private String codigo;
    private Boolean requiereReferencia;
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

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Boolean getRequiereReferencia() {
        return requiereReferencia;
    }

    public void setRequiereReferencia(Boolean requiereReferencia) {
        this.requiereReferencia = requiereReferencia;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
