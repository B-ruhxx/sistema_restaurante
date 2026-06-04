package com.restaurante.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CompraRequest {

    private String codigoCompra;

    @NotNull(message = "El proveedor es obligatorio.")
    private Integer idProveedor;

    @NotEmpty(message = "La compra debe contener al menos un insumo.")
    private List<DetalleCompraRequest> detalles;

    private String observacion;

    public CompraRequest() {}

    public String getCodigoCompra() { return codigoCompra; }
    public void setCodigoCompra(String codigoCompra) { this.codigoCompra = codigoCompra; }

    public Integer getIdProveedor() { return idProveedor; }
    public void setIdProveedor(Integer idProveedor) { this.idProveedor = idProveedor; }

    public List<DetalleCompraRequest> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleCompraRequest> detalles) { this.detalles = detalles; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
}
