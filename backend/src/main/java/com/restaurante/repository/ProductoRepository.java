package com.restaurante.repository;

import com.restaurante.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    @EntityGraph(attributePaths = { "productoPadre", "categoria" })
    Optional<Producto> findDetalleByIdProducto(Integer idProducto);

    List<Producto> findByCategoriaIdCategoria(Integer idCategoria);
    List<Producto> findByEstado(Producto.Estado estado);
    List<Producto> findByEsSkuFalseAndEstado(Producto.Estado estado);
    List<Producto> findByEsSkuTrueAndEstado(Producto.Estado estado);
    List<Producto> findByProductoPadreIdProducto(Integer idProductoPadre);
    List<Producto> findByProductoPadreIdProductoAndEstado(Integer idProductoPadre, Producto.Estado estado);
    long countByProductoPadreIdProducto(Integer idProductoPadre);
}
