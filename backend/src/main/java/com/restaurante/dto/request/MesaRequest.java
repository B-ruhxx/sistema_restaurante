package com.restaurante.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MesaRequest {
    @NotBlank(message = "El numero de mesa es obligatorio")
    @Size(max = 20, message = "El numero de mesa no puede exceder 20 caracteres")
    private String numero;

    @Min(value = 1, message = "La capacidad debe ser mayor a 0")
    private Integer capacidad;

    @Size(max = 80, message = "La ubicacion no puede exceder 80 caracteres")
    private String ubicacion;

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public Integer getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(Integer capacidad) {
        this.capacidad = capacidad;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

}
