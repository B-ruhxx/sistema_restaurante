package com.restaurante.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ComboRequest {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    private String nombre;

    private String descripcion;
    private String imagenUrl;
    private String etiqueta;
    private LocalDate validoHasta;

    @NotNull(message = "El precio es obligatorio")
    @PositiveOrZero(message = "El precio no puede ser negativo")
    private BigDecimal precio;

    private String estado;

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public LocalDate getValidoHasta() {
        return validoHasta;
    }

    public void setValidoHasta(LocalDate validoHasta) {
        this.validoHasta = validoHasta;
    }

    private List<ComboDetalleRequest> detalles;

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

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public List<ComboDetalleRequest> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<ComboDetalleRequest> detalles) {
        this.detalles = detalles;
    }

    public static class ComboDetalleRequest {
        @NotNull(message = "El ID de producto es obligatorio")
        private Integer idProducto;

        @NotNull(message = "La cantidad es obligatoria")
        @Positive(message = "La cantidad debe ser mayor a 0")
        private Integer cantidad;

        public Integer getIdProducto() {
            return idProducto;
        }

        public void setIdProducto(Integer idProducto) {
            this.idProducto = idProducto;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }
    }
}
