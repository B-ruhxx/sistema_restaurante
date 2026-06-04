package com.restaurante.repository;

import com.restaurante.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Integer> {
    Optional<Venta> findByCodigoVenta(String codigoVenta);
    List<Venta> findByEstado(Venta.Estado estado);
}
