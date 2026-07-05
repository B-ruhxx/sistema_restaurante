package com.restaurante.repository;

import com.restaurante.entity.MovimientoCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Integer> {
    List<MovimientoCaja> findByCajaIdCaja(Integer idCaja);
    List<MovimientoCaja> findByCajaIdCajaOrderByFechaDescIdMovimientoDesc(Integer idCaja);

    @Query("select coalesce(sum(m.monto), 0) from MovimientoCaja m where m.caja.idCaja = :idCaja and m.tipo = :tipo")
    BigDecimal sumMontoByCajaIdAndTipo(@Param("idCaja") Integer idCaja, @Param("tipo") MovimientoCaja.Tipo tipo);
}
