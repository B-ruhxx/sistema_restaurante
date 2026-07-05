package com.restaurante.dto.response;

import java.util.List;

public class ProductoDetalleResponse {
    private ProductoResponse producto;
    private List<RecetaProductoResponse> receta;

    public ProductoResponse getProducto() {
        return producto;
    }

    public void setProducto(ProductoResponse producto) {
        this.producto = producto;
    }

    public List<RecetaProductoResponse> getReceta() {
        return receta;
    }

    public void setReceta(List<RecetaProductoResponse> receta) {
        this.receta = receta;
    }
}
