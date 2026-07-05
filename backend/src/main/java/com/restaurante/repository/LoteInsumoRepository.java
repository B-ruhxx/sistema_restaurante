package com.restaurante.repository;

import com.restaurante.entity.LoteInsumo;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoteInsumoRepository extends JpaRepository<LoteInsumo, Integer> {
    @Query("""
            select l from LoteInsumo l
            where l.insumo.idInsumo = :idInsumo
              and l.estado = 'DISPONIBLE'
              and l.fechaVencimiento >= :hoy
              and l.cantidadDisponible > :cantidad
            order by l.fechaVencimiento asc, l.idLoteInsumo asc
            """)
    List<LoteInsumo> findDisponiblesFifo(
            @Param("idInsumo") Integer idInsumo,
            @Param("cantidad") BigDecimal cantidad,
            @Param("hoy") LocalDate hoy);

    @Query("select coalesce(sum(l.cantidadDisponible), 0) from LoteInsumo l where l.insumo.idInsumo = :idInsumo and l.estado <> 'ANULADO'")
    BigDecimal sumContableByInsumo(@Param("idInsumo") Integer idInsumo);

    List<LoteInsumo> findByDetalleCompraIdDetalleCompra(Integer idDetalleCompra);
}
