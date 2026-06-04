package com.restaurante.repository;

import com.restaurante.entity.VarianteProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VarianteProductoRepository extends JpaRepository<VarianteProducto, Integer> {
    List<VarianteProducto> findByProductoIdProducto(Integer idProducto);
}
