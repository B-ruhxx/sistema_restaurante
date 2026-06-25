package com.restaurante.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CobrarPedidoRequest {
    @NotBlank(message = "El tipo de comprobante es obligatorio")
    private String tipoComprobante;

    private String serie;
    private String correlativo;

    @Valid
    @NotEmpty(message = "Debe registrar al menos un pago")
    private List<VentaPagoRequest> pagos;

    public String getTipoComprobante() {
        return tipoComprobante;
    }

    public void setTipoComprobante(String tipoComprobante) {
        this.tipoComprobante = tipoComprobante;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getCorrelativo() {
        return correlativo;
    }

    public void setCorrelativo(String correlativo) {
        this.correlativo = correlativo;
    }

    public List<VentaPagoRequest> getPagos() {
        return pagos;
    }

    public void setPagos(List<VentaPagoRequest> pagos) {
        this.pagos = pagos;
    }
}
