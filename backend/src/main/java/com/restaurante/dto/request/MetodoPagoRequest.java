package com.restaurante.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MetodoPagoRequest {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50, message = "El nombre no puede exceder los 50 caracteres")
    private String nombre;

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 30, message = "El código no puede exceder los 30 caracteres")
    private String codigo;

    private Boolean requiereReferencia;
    private String estado;

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
