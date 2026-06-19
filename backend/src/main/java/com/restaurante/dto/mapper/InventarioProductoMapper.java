package com.restaurante.dto.mapper;

import com.restaurante.dto.response.InventarioProductoResponse;
import com.restaurante.entity.InventarioProducto;
import org.springframework.stereotype.Component;

@Component
public class InventarioProductoMapper {

    public InventarioProductoResponse toResponse(InventarioProducto entity) {
        if (entity == null) return null;
        InventarioProductoResponse response = new InventarioProductoResponse();
        response.setIdInventario(entity.getIdInventario());
        response.setStock(entity.getStock());
        response.setStockMinimo(entity.getStockMinimo());
        if (entity.getProducto() != null) {
            response.setIdProducto(entity.getProducto().getIdProducto());
            response.setNombreProducto(entity.getProducto().getNombre());
        }
        return response;
    }
}
