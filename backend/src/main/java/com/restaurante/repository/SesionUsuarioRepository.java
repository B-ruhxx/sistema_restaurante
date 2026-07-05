package com.restaurante.repository;

import com.restaurante.entity.SesionUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SesionUsuarioRepository extends JpaRepository<SesionUsuario, Long> {
    List<SesionUsuario> findByEmpleadoIdEmpleado(Integer idEmpleado);
    List<SesionUsuario> findByEmpleadoIdEmpleadoOrderByFechaInicioDesc(Integer idEmpleado);
    Optional<SesionUsuario> findFirstByEmpleadoIdEmpleadoOrderByFechaInicioDesc(Integer idEmpleado);

    @Modifying
    @Query(value = "UPDATE sesion_usuario SET fecha_cierre = CURRENT_TIMESTAMP, estado = 'CERRADA' WHERE id_empleado = :idEmpleado AND fecha_cierre IS NULL", nativeQuery = true)
    int cerrarSesionesActivas(@Param("idEmpleado") Integer idEmpleado);
}
