package com.restaurante.repository;

import com.restaurante.entity.ComboProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComboProductoRepository extends JpaRepository<ComboProducto, Integer> {
    List<ComboProducto> findByEstado(ComboProducto.Estado estado);
}
