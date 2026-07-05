package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ComboResponse {
    private Integer idCombo;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private String imagenUrl;
    private String etiqueta;
    private LocalDate validoHasta;
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
    private List<ComboDetalleResponse> detalles;

    public Integer getIdCombo() {
        return idCombo;
    }

    public void setIdCombo(Integer idCombo) {
        this.idCombo = idCombo;
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

    public List<ComboDetalleResponse> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<ComboDetalleResponse> detalles) {
        this.detalles = detalles;
    }

    public static class ComboDetalleResponse {
        private Integer idComboDetalle;
        private Integer idProducto;
        private String nombreProducto;
        private BigDecimal precioProducto;
        private Integer cantidad;

        public Integer getIdComboDetalle() {
            return idComboDetalle;
        }

        public void setIdComboDetalle(Integer idComboDetalle) {
            this.idComboDetalle = idComboDetalle;
        }

        public Integer getIdProducto() {
            return idProducto;
        }

        public void setIdProducto(Integer idProducto) {
            this.idProducto = idProducto;
        }

        public String getNombreProducto() {
            return nombreProducto;
        }

        public void setNombreProducto(String nombreProducto) {
            this.nombreProducto = nombreProducto;
        }

        public BigDecimal getPrecioProducto() {
            return precioProducto;
        }

        public void setPrecioProducto(BigDecimal precioProducto) {
            this.precioProducto = precioProducto;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }
    }
}
