package com.restaurante.repository;

import com.restaurante.entity.VentaPago;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VentaPagoRepository extends JpaRepository<VentaPago, Integer> {
    List<VentaPago> findByVentaIdVenta(Integer idVenta);
}
