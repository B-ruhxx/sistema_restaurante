package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class LoteProductoResponse {
    private Integer idLoteProducto;
    private Integer idProducto;
    private String nombreProducto;
    private String skuProducto;
    private Integer cantidadInicial;
    private Integer cantidadDisponible;
    private BigDecimal costoUnitario;
    private LocalDate fechaVencimiento;
    private String estado;
    private Integer idCompra;
    private String codigoCompra;
    private String proveedorNombre;
    private LocalDateTime fechaCompra;

    public Integer getIdLoteProducto() { return idLoteProducto; }
    public void setIdLoteProducto(Integer idLoteProducto) { this.idLoteProducto = idLoteProducto; }

    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public String getSkuProducto() { return skuProducto; }
    public void setSkuProducto(String skuProducto) { this.skuProducto = skuProducto; }

    public Integer getCantidadInicial() { return cantidadInicial; }
    public void setCantidadInicial(Integer cantidadInicial) { this.cantidadInicial = cantidadInicial; }

    public Integer getCantidadDisponible() { return cantidadDisponible; }
    public void setCantidadDisponible(Integer cantidadDisponible) { this.cantidadDisponible = cantidadDisponible; }

    public BigDecimal getCostoUnitario() { return costoUnitario; }
    public void setCostoUnitario(BigDecimal costoUnitario) { this.costoUnitario = costoUnitario; }

    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Integer getIdCompra() { return idCompra; }
    public void setIdCompra(Integer idCompra) { this.idCompra = idCompra; }

    public String getCodigoCompra() { return codigoCompra; }
    public void setCodigoCompra(String codigoCompra) { this.codigoCompra = codigoCompra; }

    public String getProveedorNombre() { return proveedorNombre; }
    public void setProveedorNombre(String proveedorNombre) { this.proveedorNombre = proveedorNombre; }

    public LocalDateTime getFechaCompra() { return fechaCompra; }
    public void setFechaCompra(LocalDateTime fechaCompra) { this.fechaCompra = fechaCompra; }
}
