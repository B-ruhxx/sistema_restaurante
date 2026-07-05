package com.restaurante.dto;

public class AlertaStockDto {
    private String nombre;
    private Integer stock;
    private Integer stockMinimo;
    private String tipoRecurso;

    public AlertaStockDto() {}

    public AlertaStockDto(String nombre, Integer stock, Integer stockMinimo) {
        this.nombre = nombre;
        this.stock = stock;
        this.stockMinimo = stockMinimo;
    }

    public AlertaStockDto(String nombre, Integer stock, Integer stockMinimo, String tipoRecurso) {
        this.nombre = nombre;
        this.stock = stock;
        this.stockMinimo = stockMinimo;
        this.tipoRecurso = tipoRecurso;
    }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Integer getStockMinimo() { return stockMinimo; }
    public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }

    public String getTipoRecurso() { return tipoRecurso; }
    public void setTipoRecurso(String tipoRecurso) { this.tipoRecurso = tipoRecurso; }
}
