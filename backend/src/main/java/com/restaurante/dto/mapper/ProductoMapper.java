package com.restaurante.dto.mapper;

import com.restaurante.dto.request.ProductoRequest;
import com.restaurante.dto.response.ProductoResponse;
import com.restaurante.entity.Producto;
import org.springframework.stereotype.Component;

@Component
public class ProductoMapper {

    public ProductoResponse toResponse(Producto entity) {
        if (entity == null) return null;
        ProductoResponse dto = new ProductoResponse();
        dto.setIdProducto(entity.getIdProducto());
        dto.setNombre(entity.getNombre());
        dto.setDescripcion(entity.getDescripcion());
        dto.setImagenUrl(entity.getImagenUrl());
        dto.setPrecio(entity.getPrecio());
        if (entity.getTipoProducto() != null) {
            dto.setTipoProducto(entity.getTipoProducto().name());
        }
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        if (entity.getCategoria() != null) {
            dto.setIdCategoria(entity.getCategoria().getIdCategoria());
            dto.setNombreCategoria(entity.getCategoria().getNombre());
        }
        return dto;
    }

    public Producto toEntity(ProductoRequest request) {
        if (request == null) return null;
        Producto entity = new Producto();
        entity.setNombre(request.getNombre());
        entity.setDescripcion(request.getDescripcion());
        entity.setImagenUrl(request.getImagenUrl());
        entity.setPrecio(request.getPrecio());
        if (request.getTipoProducto() != null) {
            entity.setTipoProducto(Producto.TipoProducto.valueOf(request.getTipoProducto()));
        }
        if (request.getEstado() != null) {
            entity.setEstado(Producto.Estado.valueOf(request.getEstado()));
        }
        return entity;
    }
}
