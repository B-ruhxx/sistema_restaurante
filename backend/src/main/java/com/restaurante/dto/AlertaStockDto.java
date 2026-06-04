package com.restaurante.dto;

public class AlertaStockDto {
    private String nombre;
    private Integer stock;
    private Integer stockMinimo;

    public AlertaStockDto() {}

    public AlertaStockDto(String nombre, Integer stock, Integer stockMinimo) {
        this.nombre = nombre;
        this.stock = stock;
        this.stockMinimo = stockMinimo;
    }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Integer getStockMinimo() { return stockMinimo; }
    public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }
}
