package com.restaurante.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ProveedorRequest {
    @NotBlank(message = "La razón social es obligatoria")
    @Size(max = 150, message = "La razón social no puede exceder los 150 caracteres")
    private String razonSocial;

    @Size(max = 11, message = "El RUC no puede exceder los 11 caracteres")
    private String ruc;

    @Size(max = 30, message = "El teléfono no puede exceder los 30 caracteres")
    private String telefono;

    @Size(max = 120, message = "El email no puede exceder los 120 caracteres")
    private String email;

    @Size(max = 255, message = "La dirección no puede exceder los 255 caracteres")
    private String direccion;

    @Size(max = 120, message = "El contacto no puede exceder los 120 caracteres")
    private String contacto;

    private String estado;

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getContacto() {
        return contacto;
    }

    public void setContacto(String contacto) {
        this.contacto = contacto;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
