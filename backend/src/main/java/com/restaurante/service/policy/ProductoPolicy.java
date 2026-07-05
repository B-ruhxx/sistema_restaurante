package com.restaurante.service.policy;

import com.restaurante.entity.Producto;
import com.restaurante.repository.RecetaProductoRepository;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class ProductoPolicy {

    public void validarCatalogo(Producto producto) {
        if (producto == null) {
            throw new IllegalArgumentException("El producto es obligatorio.");
        }

        if (Boolean.FALSE.equals(producto.getEsSku())) {
            validarPadre(producto);
            return;
        }

        validarSku(producto);
    }

    public void validarComprable(Producto producto) {
        validarSkuOperativo(producto);
        if (producto.getTipoProducto() != Producto.TipoProducto.INVENTARIO_DIRECTO) {
            throw new IllegalArgumentException("Solo un SKU de inventario directo puede ingresar por compra.");
        }
    }

    public void validarAjustable(Producto producto) {
        validarSkuOperativo(producto);
        if (producto.getTipoProducto() != Producto.TipoProducto.INVENTARIO_DIRECTO) {
            throw new IllegalStateException("Solo se puede ajustar stock físico de SKU de inventario directo.");
        }
    }

    public void validarVendible(Producto producto, RecetaProductoRepository recetaProductoRepository) {
        validarSkuOperativo(producto);
        if (producto.getPrecio() == null || producto.getPrecio().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("El SKU no tiene precio operativo.");
        }
        if (producto.getTipoProducto() == Producto.TipoProducto.PREPARADO
                && recetaProductoRepository.findByProductoIdProducto(producto.getIdProducto()).isEmpty()) {
            throw new IllegalStateException("El SKU preparado requiere una receta antes de venderse.");
        }
    }

    public void validarEnrutamientoCocina(Producto producto) {
        validarSkuOperativo(producto);
        if (producto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO
                && producto.getTiempoPreparacionMinutos() != null) {
            throw new IllegalStateException("Un SKU de inventario directo no debe tener tiempo de preparación.");
        }
    }

    private void validarPadre(Producto producto) {
        if (producto.getProductoPadre() != null) {
            throw new IllegalArgumentException("Un producto padre no puede depender de otro producto.");
        }
        if (producto.getSku() != null && !producto.getSku().isBlank()) {
            throw new IllegalArgumentException("Un producto padre no debe tener SKU.");
        }
        if (producto.getPrecio() != null) {
            throw new IllegalArgumentException("Un producto padre no debe tener precio operativo.");
        }
        if (producto.getTipoProducto() != null) {
            throw new IllegalArgumentException("Un producto padre no debe tener tipo operativo.");
        }
        if (producto.getTiempoPreparacionMinutos() != null) {
            throw new IllegalArgumentException("Un producto padre no debe tener tiempo de preparación.");
        }
    }

    private void validarSku(Producto producto) {
        if (producto.getProductoPadre() == null) {
            throw new IllegalArgumentException("Un SKU debe pertenecer a un producto padre.");
        }
        if (producto.getSku() == null || producto.getSku().isBlank()) {
            throw new IllegalArgumentException("Un SKU debe tener código único.");
        }
        if (producto.getPrecio() == null || producto.getPrecio().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Un SKU debe tener precio mayor a 0.");
        }
        if (producto.getTipoProducto() == null) {
            throw new IllegalArgumentException("Un SKU debe tener tipo de producto.");
        }
        if (producto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO
                && producto.getTiempoPreparacionMinutos() != null) {
            throw new IllegalArgumentException("Un SKU de inventario directo no debe tener tiempo de preparación.");
        }
        if (producto.getTipoProducto() == Producto.TipoProducto.PREPARADO
                && (producto.getTiempoPreparacionMinutos() == null || producto.getTiempoPreparacionMinutos() <= 0)) {
            throw new IllegalArgumentException("Un SKU preparado debe tener tiempo de preparación mayor a 0.");
        }
    }

    private void validarSkuOperativo(Producto producto) {
        if (producto == null) {
            throw new IllegalArgumentException("El producto es obligatorio.");
        }
        if (Boolean.FALSE.equals(producto.getEsSku())) {
            throw new IllegalStateException("No se puede operar contra un producto padre. Selecciona un SKU.");
        }
        if (!Boolean.TRUE.equals(producto.getEsSku())) {
            throw new IllegalStateException("El producto no está marcado como SKU operativo.");
        }
        if (producto.getProductoPadre() == null) {
            throw new IllegalStateException("El SKU no tiene producto padre asociado.");
        }
        if (producto.getEstado() != Producto.Estado.ACTIVO) {
            throw new IllegalStateException("El SKU no está activo.");
        }
    }
}
