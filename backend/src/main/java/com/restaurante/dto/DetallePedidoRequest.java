package com.restaurante.dto;

import java.util.List;

public class DetallePedidoRequest {
    private Integer idProducto;
    private Integer idCombo;
    private Integer cantidad;
    private String observacion;
    private List<Integer> extrasIds;

    public DetallePedidoRequest() {}

    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

    public Integer getIdCombo() { return idCombo; }
    public void setIdCombo(Integer idCombo) { this.idCombo = idCombo; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }

    public List<Integer> getExtrasIds() { return extrasIds; }
    public void setExtrasIds(List<Integer> extrasIds) { this.extrasIds = extrasIds; }
}
