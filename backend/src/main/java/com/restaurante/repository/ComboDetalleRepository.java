package com.restaurante.repository;

import com.restaurante.entity.ComboDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComboDetalleRepository extends JpaRepository<ComboDetalle, Integer> {
    List<ComboDetalle> findByComboIdCombo(Integer idCombo);
    boolean existsByProductoIdProducto(Integer idProducto);
}
