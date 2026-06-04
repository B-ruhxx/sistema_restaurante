package com.restaurante.dto;

import java.math.BigDecimal;

public class StockInsuficienteDto {
    private String producto;
    private String insumo;
    private BigDecimal stock;
    private BigDecimal cantidadNecesaria;

    public StockInsuficienteDto() {}

    public StockInsuficienteDto(String producto, String insumo, BigDecimal stock, BigDecimal cantidadNecesaria) {
        this.producto = producto;
        this.insumo = insumo;
        this.stock = stock;
        this.cantidadNecesaria = cantidadNecesaria;
    }

    public String getProducto() { return producto; }
    public void setProducto(String producto) { this.producto = producto; }

    public String getInsumo() { return insumo; }
    public void setInsumo(String insumo) { this.insumo = insumo; }

    public BigDecimal getStock() { return stock; }
    public void setStock(BigDecimal stock) { this.stock = stock; }

    public BigDecimal getCantidadNecesaria() { return cantidadNecesaria; }
    public void setCantidadNecesaria(BigDecimal cantidadNecesaria) { this.cantidadNecesaria = cantidadNecesaria; }
}
