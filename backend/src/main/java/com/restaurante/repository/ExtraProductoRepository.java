package com.restaurante.repository;

import com.restaurante.entity.ExtraProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExtraProductoRepository extends JpaRepository<ExtraProducto, Integer> {
    List<ExtraProducto> findByEstado(ExtraProducto.Estado estado);
}
