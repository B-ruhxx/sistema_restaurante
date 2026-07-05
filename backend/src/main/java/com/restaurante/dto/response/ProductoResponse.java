package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ProductoResponse {
    private Integer idProducto;
    private String nombre;
    private String descripcion;
    private String imagenUrl;
    private BigDecimal precio;
    private String tipoProducto;
    private Integer tiempoPreparacionMinutos;
    private String estado;
    private Integer idCategoria;
    private String nombreCategoria;
    private Integer idProductoPadre;
    private String nombreProductoPadre;
    private String sku;
    private Boolean esSku;
    private Boolean tieneSkus;
    private Integer stockActual;
    private Integer stockTotal;
    private BigDecimal stockMinimo;
    private Integer lotesDisponibles;
    private LocalDate proximoVencimiento;

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public String getTipoProducto() {
        return tipoProducto;
    }

    public void setTipoProducto(String tipoProducto) {
        this.tipoProducto = tipoProducto;
    }

    public Integer getTiempoPreparacionMinutos() {
        return tiempoPreparacionMinutos;
    }

    public void setTiempoPreparacionMinutos(Integer tiempoPreparacionMinutos) {
        this.tiempoPreparacionMinutos = tiempoPreparacionMinutos;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Integer getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(Integer idCategoria) {
        this.idCategoria = idCategoria;
    }

    public String getNombreCategoria() {
        return nombreCategoria;
    }

    public void setNombreCategoria(String nombreCategoria) {
        this.nombreCategoria = nombreCategoria;
    }

    public Integer getIdProductoPadre() {
        return idProductoPadre;
    }

    public void setIdProductoPadre(Integer idProductoPadre) {
        this.idProductoPadre = idProductoPadre;
    }

    public String getNombreProductoPadre() {
        return nombreProductoPadre;
    }

    public void setNombreProductoPadre(String nombreProductoPadre) {
        this.nombreProductoPadre = nombreProductoPadre;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Boolean getEsSku() {
        return esSku;
    }

    public void setEsSku(Boolean esSku) {
        this.esSku = esSku;
    }

    public Boolean getTieneSkus() {
        return tieneSkus;
    }

    public void setTieneSkus(Boolean tieneSkus) {
        this.tieneSkus = tieneSkus;
    }

    public Integer getStockActual() {
        return stockActual;
    }

    public void setStockActual(Integer stockActual) {
        this.stockActual = stockActual;
    }

    public Integer getStockTotal() {
        return stockTotal;
    }

    public void setStockTotal(Integer stockTotal) {
        this.stockTotal = stockTotal;
    }

    public BigDecimal getStockMinimo() {
        return stockMinimo;
    }

    public void setStockMinimo(BigDecimal stockMinimo) {
        this.stockMinimo = stockMinimo;
    }

    public Integer getLotesDisponibles() {
        return lotesDisponibles;
    }

    public void setLotesDisponibles(Integer lotesDisponibles) {
        this.lotesDisponibles = lotesDisponibles;
    }

    public LocalDate getProximoVencimiento() {
        return proximoVencimiento;
    }

    public void setProximoVencimiento(LocalDate proximoVencimiento) {
        this.proximoVencimiento = proximoVencimiento;
    }
}
