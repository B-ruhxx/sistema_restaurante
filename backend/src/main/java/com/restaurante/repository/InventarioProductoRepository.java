package com.restaurante.repository;

import com.restaurante.entity.InventarioProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InventarioProductoRepository extends JpaRepository<InventarioProducto, Integer> {
    Optional<InventarioProducto> findByProductoIdProducto(Integer idProducto);
}
