package com.restaurante.repository;

import com.restaurante.entity.Caja;
import com.restaurante.entity.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CajaRepository extends JpaRepository<Caja, Integer> {
    Optional<Caja> findByEmpleadoAndEstado(Empleado empleado, Caja.Estado estado);
    Optional<Caja> findByEstado(Caja.Estado estado);
    Optional<Caja> findFirstByEstadoOrderByFechaAperturaDesc(Caja.Estado estado);
}
