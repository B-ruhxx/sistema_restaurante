package com.restaurante.repository;

import com.restaurante.entity.PedidoExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PedidoExtraRepository extends JpaRepository<PedidoExtra, Integer> {
    List<PedidoExtra> findByDetallePedidoIdDetallePedido(Integer idDetallePedido);
}
