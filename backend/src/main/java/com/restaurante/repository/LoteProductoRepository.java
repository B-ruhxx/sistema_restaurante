package com.restaurante.repository;

import com.restaurante.entity.LoteProducto;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoteProductoRepository extends JpaRepository<LoteProducto, Integer> {
    List<LoteProducto> findByProductoIdProductoAndCantidadDisponibleGreaterThanOrderByFechaVencimientoAscIdLoteProductoAsc(
            Integer idProducto,
            Integer cantidad);

    List<LoteProducto> findByProductoIdProductoOrderByFechaVencimientoAscIdLoteProductoAsc(Integer idProducto);

    List<LoteProducto> findByProductoProductoPadreIdProductoOrderByFechaVencimientoAscIdLoteProductoAsc(
            Integer idProductoPadre);

    List<LoteProducto> findByDetalleCompraIdDetalleCompra(Integer idDetalleCompra);

    @Query("select count(l) from LoteProducto l where l.producto.idProducto = :idProducto and l.cantidadDisponible > 0")
    Long countDisponiblesByProducto(@Param("idProducto") Integer idProducto);

    @Query("select coalesce(sum(l.cantidadDisponible), 0) from LoteProducto l where l.producto.idProducto = :idProducto and l.cantidadDisponible > 0")
    Long sumDisponibleByProducto(@Param("idProducto") Integer idProducto);

    @Query("select min(l.fechaVencimiento) from LoteProducto l where l.producto.idProducto = :idProducto and l.cantidadDisponible > 0")
    LocalDate findProximoVencimientoByProducto(@Param("idProducto") Integer idProducto);

    @Query("select count(l) from LoteProducto l where l.producto.productoPadre.idProducto = :idProductoPadre and l.cantidadDisponible > 0")
    Long countDisponiblesByProductoPadre(@Param("idProductoPadre") Integer idProductoPadre);

    @Query("select coalesce(sum(l.cantidadDisponible), 0) from LoteProducto l where l.producto.productoPadre.idProducto = :idProductoPadre and l.cantidadDisponible > 0")
    Long sumDisponibleByProductoPadre(@Param("idProductoPadre") Integer idProductoPadre);

    @Query("select min(l.fechaVencimiento) from LoteProducto l where l.producto.productoPadre.idProducto = :idProductoPadre and l.cantidadDisponible > 0")
    LocalDate findProximoVencimientoByProductoPadre(@Param("idProductoPadre") Integer idProductoPadre);
}
