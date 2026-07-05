package com.restaurante.repository;

import com.restaurante.entity.Venta;
import com.restaurante.repository.projection.VentaPorHoraProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Integer> {
    Optional<Venta> findBySerieAndNumero(String serie, String numero);
    List<Venta> findByEstado(Venta.Estado estado);

    @Query("select coalesce(sum(v.total), 0) from Venta v where v.caja.idCaja = :idCaja and v.estado = :estado")
    BigDecimal sumTotalByCajaIdAndEstado(@Param("idCaja") Integer idCaja, @Param("estado") Venta.Estado estado);

    default List<VentaPorHoraProjection> ventasPorHora(LocalDateTime inicio, LocalDateTime fin) {
        return ventasPorHora(inicio, fin, Venta.Estado.EMITIDA);
    }

    @Query("""
            select function('hour', v.fecha) as hora,
                   coalesce(sum(v.total), 0) as total,
                   count(v) as cantidad
            from Venta v
            where v.estado = :estado
              and v.fecha >= :inicio
              and v.fecha < :fin
            group by function('hour', v.fecha)
            order by function('hour', v.fecha)
            """)
    List<VentaPorHoraProjection> ventasPorHora(@Param("inicio") LocalDateTime inicio,
                                                @Param("fin") LocalDateTime fin,
                                                @Param("estado") Venta.Estado estado);
}
