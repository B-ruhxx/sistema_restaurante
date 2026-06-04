package com.restaurante.repository;

import com.restaurante.entity.DetalleCompraInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DetalleCompraInsumoRepository extends JpaRepository<DetalleCompraInsumo, Integer> {
    List<DetalleCompraInsumo> findByCompraIdCompra(Integer idCompra);
}
