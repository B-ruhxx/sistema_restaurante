package com.restaurante.repository;

import com.restaurante.entity.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmpleadoRepository extends JpaRepository<Empleado, Integer> {
    Optional<Empleado> findByUsername(String username);
    Optional<Empleado> findByEmail(String email);
}
