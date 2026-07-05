package com.restaurante.repository;

import com.restaurante.entity.AlertaSeguridad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertaSeguridadRepository extends JpaRepository<AlertaSeguridad, Integer> {
    List<AlertaSeguridad> findTop50ByEstadoOrderByFechaDesc(AlertaSeguridad.Estado estado);

    long countByUsuarioIgnoreCaseAndTituloAndFechaAfter(String usuario, String titulo, LocalDateTime fecha);
}
