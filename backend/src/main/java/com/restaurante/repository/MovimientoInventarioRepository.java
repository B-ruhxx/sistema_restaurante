package com.restaurante.repository;

import com.restaurante.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Integer> {
    List<MovimientoInventario> findByInsumoIdInsumo(Integer idInsumo);
    List<MovimientoInventario> findByProductoIdProducto(Integer idProducto);
    List<MovimientoInventario> findByReferenceIdAndReferenceTypeAndTipoRecurso(
            Integer referenceId,
            String referenceType,
            MovimientoInventario.TipoRecurso tipoRecurso);
}
