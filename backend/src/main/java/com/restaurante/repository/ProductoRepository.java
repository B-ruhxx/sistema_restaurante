package com.restaurante.repository;

import com.restaurante.entity.Producto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    interface TieneSkusRow {
        Integer getIdProducto();

        long getSkuCount();
    }

    @Override
    @EntityGraph(attributePaths = { "productoPadre", "categoria" })
    List<Producto> findAll();

    @EntityGraph(attributePaths = { "productoPadre", "categoria" })
    Optional<Producto> findDetalleByIdProducto(Integer idProducto);

    @EntityGraph(attributePaths = { "productoPadre", "categoria" })
    List<Producto> findAllWithGraphByEstado(Producto.Estado estado);

    @EntityGraph(attributePaths = { "productoPadre", "categoria" })
    List<Producto> findAllWithGraphByEsSkuFalseAndEstado(Producto.Estado estado);

    @EntityGraph(attributePaths = { "productoPadre", "categoria" })
    List<Producto> findAllWithGraphByProductoPadreIdProductoAndEstado(Integer idProductoPadre, Producto.Estado estado);

    @Query("select p.idProducto as idProducto, count(s) as skuCount from Producto p left join p.skus s where p.idProducto in :ids group by p.idProducto")
    List<TieneSkusRow> findTieneSkusByIds(@Param("ids") List<Integer> ids);

    List<Producto> findByCategoriaIdCategoria(Integer idCategoria);
    List<Producto> findByEstado(Producto.Estado estado);
    List<Producto> findByEsSkuFalseAndEstado(Producto.Estado estado);
    List<Producto> findByEsSkuTrueAndEstado(Producto.Estado estado);
    List<Producto> findByProductoPadreIdProducto(Integer idProductoPadre);
    List<Producto> findByProductoPadreIdProductoAndEstado(Integer idProductoPadre, Producto.Estado estado);
    long countByProductoPadreIdProducto(Integer idProductoPadre);
}
