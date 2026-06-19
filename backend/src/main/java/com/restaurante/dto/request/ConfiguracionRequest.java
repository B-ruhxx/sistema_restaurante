package com.restaurante.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class ConfiguracionRequest {
    @NotBlank(message = "El nombre de la empresa es obligatorio")
    @Size(max = 150, message = "El nombre de la empresa no puede exceder los 150 caracteres")
    private String nombreEmpresa;

    @Size(max = 150, message = "La razón social no puede exceder los 150 caracteres")
    private String razonSocial;

    @NotBlank(message = "El RUC es obligatorio")
    @Size(max = 20, message = "El RUC no puede exceder los 20 caracteres")
    private String ruc;

    private String logoUrl;

    @Size(max = 255, message = "La dirección no puede exceder los 255 caracteres")
    private String direccion;

    @Size(max = 20, message = "El teléfono no puede exceder los 20 caracteres")
    private String telefono;

    @Size(max = 100, message = "El email no puede exceder los 100 caracteres")
    private String email;

    @Size(max = 10, message = "La moneda no puede exceder los 10 caracteres")
    private String moneda;

    @NotNull(message = "El IGV es obligatorio")
    @PositiveOrZero(message = "El IGV no puede ser negativo")
    private BigDecimal igv;

    @Size(max = 10, message = "La serie de la boleta no puede exceder los 10 caracteres")
    private String serieBoleta;

    @Size(max = 10, message = "La serie de la factura no puede exceder los 10 caracteres")
    private String serieFactura;

    public String getNombreEmpresa() {
        return nombreEmpresa;
    }

    public void setNombreEmpresa(String nombreEmpresa) {
        this.nombreEmpresa = nombreEmpresa;
    }

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

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
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

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public BigDecimal getIgv() {
        return igv;
    }

    public void setIgv(BigDecimal igv) {
        this.igv = igv;
    }

    public String getSerieBoleta() {
        return serieBoleta;
    }

    public void setSerieBoleta(String serieBoleta) {
        this.serieBoleta = serieBoleta;
    }

    public String getSerieFactura() {
        return serieFactura;
    }

    public void setSerieFactura(String serieFactura) {
        this.serieFactura = serieFactura;
    }
}
