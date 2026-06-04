package com.restaurante.repository;

import com.restaurante.entity.MetodoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Integer> {
    List<MetodoPago> findByEstado(MetodoPago.Estado estado);
}
