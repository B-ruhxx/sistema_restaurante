package com.restaurante.repository;

import com.restaurante.entity.LoteInsumo;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoteInsumoRepository extends JpaRepository<LoteInsumo, Integer> {
    List<LoteInsumo> findByInsumoIdInsumoAndCantidadDisponibleGreaterThanOrderByFechaVencimientoAscIdLoteInsumoAsc(
            Integer idInsumo,
            BigDecimal cantidad);

    List<LoteInsumo> findByDetalleCompraIdDetalleCompra(Integer idDetalleCompra);
}
