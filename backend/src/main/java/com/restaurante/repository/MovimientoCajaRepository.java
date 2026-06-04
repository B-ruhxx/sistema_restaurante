package com.restaurante.repository;

import com.restaurante.entity.MovimientoCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Integer> {
    List<MovimientoCaja> findByCajaIdCaja(Integer idCaja);
}
