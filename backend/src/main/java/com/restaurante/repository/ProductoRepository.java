package com.restaurante.repository;

import com.restaurante.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    List<Producto> findByCategoriaIdCategoria(Integer idCategoria);
    List<Producto> findByEstado(Producto.Estado estado);
    List<Producto> findByEsSkuFalseAndEstado(Producto.Estado estado);
    List<Producto> findByEsSkuTrueAndEstado(Producto.Estado estado);
    List<Producto> findByProductoPadreIdProducto(Integer idProductoPadre);
    List<Producto> findByProductoPadreIdProductoAndEstado(Integer idProductoPadre, Producto.Estado estado);
    long countByProductoPadreIdProducto(Integer idProductoPadre);
}
