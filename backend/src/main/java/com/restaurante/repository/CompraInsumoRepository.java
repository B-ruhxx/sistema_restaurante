package com.restaurante.repository;

import com.restaurante.entity.CompraInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompraInsumoRepository extends JpaRepository<CompraInsumo, Integer> {
    List<CompraInsumo> findByProveedorIdProveedor(Integer idProveedor);
}
