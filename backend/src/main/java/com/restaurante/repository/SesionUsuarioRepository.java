package com.restaurante.repository;

import com.restaurante.entity.SesionUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SesionUsuarioRepository extends JpaRepository<SesionUsuario, Integer> {
    List<SesionUsuario> findByEmpleadoIdEmpleado(Integer idEmpleado);
    Optional<SesionUsuario> findFirstByEmpleadoIdEmpleadoOrderByFechaLoginDesc(Integer idEmpleado);
}
