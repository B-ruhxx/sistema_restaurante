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
        dto.setSku(entity.getSku());
        dto.setEsSku(entity.getEsSku());
        dto.setNombre(entity.getNombre());
        dto.setDescripcion(entity.getDescripcion());
        dto.setImagenUrl(entity.getImagenUrl());
        dto.setPrecio(entity.getPrecio());
        if (entity.getTipoProducto() != null) {
            dto.setTipoProducto(entity.getTipoProducto().name());
        }
        dto.setTiempoPreparacionMinutos(entity.getTiempoPreparacionMinutos());
        dto.setStockMinimo(entity.getStockMinimo());
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        if (entity.getCategoria() != null) {
            dto.setIdCategoria(entity.getCategoria().getIdCategoria());
            dto.setNombreCategoria(entity.getCategoria().getNombre());
        }
        if (entity.getProductoPadre() != null) {
            dto.setIdProductoPadre(entity.getProductoPadre().getIdProducto());
            dto.setNombreProductoPadre(entity.getProductoPadre().getNombre());
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
        entity.setSku(normalizeSku(request.getSku()));
        if (request.getEsSku() != null) {
            entity.setEsSku(request.getEsSku());
        }
        if (request.getTipoProducto() != null) {
            entity.setTipoProducto(Producto.TipoProducto.valueOf(request.getTipoProducto()));
        }
        if (request.getTiempoPreparacionMinutos() != null) {
            entity.setTiempoPreparacionMinutos(request.getTiempoPreparacionMinutos());
        }
        if (request.getStockMinimo() != null) {
            entity.setStockMinimo(request.getStockMinimo());
        }
        if (request.getEstado() != null) {
            entity.setEstado(Producto.Estado.valueOf(request.getEstado()));
        }
        return entity;
    }

    public String normalizeSku(String sku) {
        if (sku == null || sku.isBlank()) {
            return null;
        }
        return sku.trim().toUpperCase();
    }
}
