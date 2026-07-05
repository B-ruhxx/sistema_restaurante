package com.restaurante.service.policy;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.restaurante.entity.Producto;
import com.restaurante.repository.RecetaProductoRepository;
import java.math.BigDecimal;
import java.lang.reflect.Proxy;
import java.util.List;
import org.junit.jupiter.api.Test;

class ProductoPolicyTest {
    private final ProductoPolicy policy = new ProductoPolicy();

    @Test
    void padreNoPuedeTenerPrecioOperativo() {
        Producto padre = new Producto();
        padre.setEsSku(false);
        padre.setNombre("Pizza");
        padre.setPrecio(new BigDecimal("10.00"));

        assertThrows(IllegalArgumentException.class, () -> policy.validarCatalogo(padre));
    }

    @Test
    void skuDirectoNoPuedeTenerTiempoPreparacion() {
        Producto padre = new Producto();
        padre.setEsSku(false);

        Producto sku = new Producto();
        sku.setEsSku(true);
        sku.setProductoPadre(padre);
        sku.setSku("BEB-500");
        sku.setPrecio(new BigDecimal("5.00"));
        sku.setTipoProducto(Producto.TipoProducto.INVENTARIO_DIRECTO);
        sku.setTiempoPreparacionMinutos(5);

        assertThrows(IllegalArgumentException.class, () -> policy.validarCatalogo(sku));
    }

    @Test
    void skuPreparadoSinRecetaNoEsVendible() {
        Producto padre = new Producto();
        padre.setEsSku(false);

        Producto sku = new Producto();
        sku.setIdProducto(10);
        sku.setEsSku(true);
        sku.setProductoPadre(padre);
        sku.setSku("PIZ-PER");
        sku.setPrecio(new BigDecimal("12.00"));
        sku.setTipoProducto(Producto.TipoProducto.PREPARADO);
        sku.setTiempoPreparacionMinutos(15);
        sku.setEstado(Producto.Estado.ACTIVO);

        RecetaProductoRepository recetaRepository = recetaRepositoryVacio();

        assertThrows(IllegalStateException.class, () -> policy.validarVendible(sku, recetaRepository));
    }

    @Test
    void skuDirectoActivoConPrecioEsVendible() {
        Producto padre = new Producto();
        padre.setEsSku(false);

        Producto sku = new Producto();
        sku.setIdProducto(11);
        sku.setEsSku(true);
        sku.setProductoPadre(padre);
        sku.setSku("GAS-500");
        sku.setPrecio(new BigDecimal("4.50"));
        sku.setTipoProducto(Producto.TipoProducto.INVENTARIO_DIRECTO);
        sku.setEstado(Producto.Estado.ACTIVO);

        RecetaProductoRepository recetaRepository = recetaRepositoryVacio();

        assertDoesNotThrow(() -> policy.validarVendible(sku, recetaRepository));
    }

    private RecetaProductoRepository recetaRepositoryVacio() {
        return (RecetaProductoRepository) Proxy.newProxyInstance(
                RecetaProductoRepository.class.getClassLoader(),
                new Class<?>[] { RecetaProductoRepository.class },
                (proxy, method, args) -> {
                    if ("findByProductoIdProducto".equals(method.getName())) {
                        return List.of();
                    }
                    throw new UnsupportedOperationException("Método no usado en test: " + method.getName());
                });
    }
}
