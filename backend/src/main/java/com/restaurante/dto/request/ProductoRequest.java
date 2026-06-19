package com.restaurante.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public class ProductoRequest {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    private String nombre;

    private String descripcion;
    private String imagenUrl;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El precio no puede ser negativo")
    private BigDecimal precio;

    @NotBlank(message = "El tipo de producto es obligatorio")
    private String tipoProducto; // PREPARADO / INVENTARIO_DIRECTO

    private String estado; // ACTIVO / INACTIVO
    private Integer idCategoria;
    
    @Min(value = 0, message = "El stock inicial no puede ser negativo")
    private Integer stockInicial;

    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    private Integer stockMinimo;

    private List<RecetaItemRequest> receta;

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

    public Integer getStockInicial() {
        return stockInicial;
    }

    public void setStockInicial(Integer stockInicial) {
        this.stockInicial = stockInicial;
    }

    public Integer getStockMinimo() {
        return stockMinimo;
    }

    public void setStockMinimo(Integer stockMinimo) {
        this.stockMinimo = stockMinimo;
    }

    public List<RecetaItemRequest> getReceta() {
        return receta;
    }

    public void setReceta(List<RecetaItemRequest> receta) {
        this.receta = receta;
    }

    public static class RecetaItemRequest {
        @NotNull(message = "El ID de insumo es obligatorio")
        private Integer idInsumo;

        @NotNull(message = "La cantidad es obligatoria")
        @DecimalMin(value = "0.0", inclusive = false, message = "La cantidad debe ser mayor a 0")
        private BigDecimal cantidad;

        public Integer getIdInsumo() {
            return idInsumo;
        }

        public void setIdInsumo(Integer idInsumo) {
            this.idInsumo = idInsumo;
        }

        public BigDecimal getCantidad() {
            return cantidad;
        }

        public void setCantidad(BigDecimal cantidad) {
            this.cantidad = cantidad;
        }
    }
}
