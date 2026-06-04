package com.restaurante.repository;

import com.restaurante.entity.RecetaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecetaProductoRepository extends JpaRepository<RecetaProducto, Integer> {
    List<RecetaProducto> findByProductoIdProducto(Integer idProducto);
}
