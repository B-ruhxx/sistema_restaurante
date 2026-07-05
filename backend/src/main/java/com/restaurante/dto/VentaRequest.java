package com.restaurante.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class VentaRequest {
    private Integer idPedido;

    @NotBlank(message = "El tipo de comprobante es obligatorio (BOLETA/FACTURA).")
    private String tipoComprobante;

    private String serie;
    private String numero;

    @NotEmpty(message = "La venta debe incluir al menos un pago.")
    private List<VentaPagoRequest> pagos;

    public VentaRequest() {}

    public Integer getIdPedido() { return idPedido; }
    public void setIdPedido(Integer idPedido) { this.idPedido = idPedido; }

    public String getTipoComprobante() { return tipoComprobante; }
    public void setTipoComprobante(String tipoComprobante) { this.tipoComprobante = tipoComprobante; }

    public String getSerie() { return serie; }
    public void setSerie(String serie) { this.serie = serie; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public List<VentaPagoRequest> getPagos() { return pagos; }
    public void setPagos(List<VentaPagoRequest> pagos) { this.pagos = pagos; }
}
