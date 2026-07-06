package com.restaurante.repository;

import com.restaurante.entity.LoteProducto;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoteProductoRepository extends JpaRepository<LoteProducto, Integer> {
    interface StockLongRow {
        Integer getId();

        Long getValue();
    }

    interface StockDateRow {
        Integer getId();

        LocalDate getValue();
    }

    @Query("""
            select l from LoteProducto l
            where l.producto.idProducto = :idProducto
              and l.estado = 'DISPONIBLE'
              and l.fechaVencimiento >= :hoy
              and l.cantidadDisponible > :cantidad
            order by l.fechaVencimiento asc, l.idLoteProducto asc
            """)
    List<LoteProducto> findDisponiblesFifo(
            @Param("idProducto") Integer idProducto,
            @Param("cantidad") Integer cantidad,
            @Param("hoy") LocalDate hoy);

    List<LoteProducto> findByProductoIdProductoOrderByFechaVencimientoAscIdLoteProductoAsc(Integer idProducto);

    List<LoteProducto> findByProductoProductoPadreIdProductoOrderByFechaVencimientoAscIdLoteProductoAsc(
            Integer idProductoPadre);

    List<LoteProducto> findByDetalleCompraIdDetalleCompra(Integer idDetalleCompra);

    @Query("select count(l) from LoteProducto l where l.producto.idProducto = :idProducto and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0")
    Long countDisponiblesByProducto(@Param("idProducto") Integer idProducto);

    @Query("select coalesce(sum(l.cantidadDisponible), 0) from LoteProducto l where l.producto.idProducto = :idProducto and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0")
    Long sumDisponibleByProducto(@Param("idProducto") Integer idProducto);

    @Query("select coalesce(sum(l.cantidadDisponible), 0) from LoteProducto l where l.producto.idProducto = :idProducto and l.estado <> 'ANULADO'")
    Long sumContableByProducto(@Param("idProducto") Integer idProducto);

    @Query("select min(l.fechaVencimiento) from LoteProducto l where l.producto.idProducto = :idProducto and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0")
    LocalDate findProximoVencimientoByProducto(@Param("idProducto") Integer idProducto);

    @Query("select count(l) from LoteProducto l where l.producto.productoPadre.idProducto = :idProductoPadre and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0")
    Long countDisponiblesByProductoPadre(@Param("idProductoPadre") Integer idProductoPadre);

    @Query("select coalesce(sum(l.cantidadDisponible), 0) from LoteProducto l where l.producto.productoPadre.idProducto = :idProductoPadre and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0")
    Long sumDisponibleByProductoPadre(@Param("idProductoPadre") Integer idProductoPadre);

    @Query("select min(l.fechaVencimiento) from LoteProducto l where l.producto.productoPadre.idProducto = :idProductoPadre and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0")
    LocalDate findProximoVencimientoByProductoPadre(@Param("idProductoPadre") Integer idProductoPadre);

    @Query("select l.producto.idProducto as id, count(l) as value from LoteProducto l where l.producto.idProducto in :ids and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0 group by l.producto.idProducto")
    List<StockLongRow> countDisponiblesByProductos(@Param("ids") List<Integer> ids);

    @Query("select l.producto.idProducto as id, coalesce(sum(l.cantidadDisponible), 0) as value from LoteProducto l where l.producto.idProducto in :ids and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0 group by l.producto.idProducto")
    List<StockLongRow> sumDisponibleByProductos(@Param("ids") List<Integer> ids);

    @Query("select l.producto.idProducto as id, min(l.fechaVencimiento) as value from LoteProducto l where l.producto.idProducto in :ids and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0 group by l.producto.idProducto")
    List<StockDateRow> findProximoVencimientoByProductos(@Param("ids") List<Integer> ids);

    @Query("select l.producto.productoPadre.idProducto as id, count(l) as value from LoteProducto l where l.producto.productoPadre.idProducto in :ids and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0 group by l.producto.productoPadre.idProducto")
    List<StockLongRow> countDisponiblesByProductosPadre(@Param("ids") List<Integer> ids);

    @Query("select l.producto.productoPadre.idProducto as id, coalesce(sum(l.cantidadDisponible), 0) as value from LoteProducto l where l.producto.productoPadre.idProducto in :ids and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0 group by l.producto.productoPadre.idProducto")
    List<StockLongRow> sumDisponibleByProductosPadre(@Param("ids") List<Integer> ids);

    @Query("select l.producto.productoPadre.idProducto as id, min(l.fechaVencimiento) as value from LoteProducto l where l.producto.productoPadre.idProducto in :ids and l.estado = 'DISPONIBLE' and l.fechaVencimiento >= current_date and l.cantidadDisponible > 0 group by l.producto.productoPadre.idProducto")
    List<StockDateRow> findProximoVencimientoByProductosPadre(@Param("ids") List<Integer> ids);
}
