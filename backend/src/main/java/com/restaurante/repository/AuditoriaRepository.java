package com.restaurante.repository;

import com.restaurante.entity.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findByEntidadOrderByFechaDesc(String entidad);
    List<Auditoria> findByEmpleadoIdEmpleadoOrderByFechaDesc(Integer idEmpleado);
}
