package com.restaurante.repository;

import com.restaurante.entity.ConsumoInsumoVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsumoInsumoVentaRepository extends JpaRepository<ConsumoInsumoVenta, Integer> {
    List<ConsumoInsumoVenta> findByVentaIdVenta(Integer idVenta);
}
