package com.restaurante.repository;

import com.restaurante.entity.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsumoRepository extends JpaRepository<Insumo, Integer> {
    List<Insumo> findByEstado(Insumo.Estado estado);
}
