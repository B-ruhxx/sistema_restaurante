package com.restaurante.repository;

import com.restaurante.entity.PedidoEstadoHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PedidoEstadoHistorialRepository extends JpaRepository<PedidoEstadoHistorial, Integer> {
    List<PedidoEstadoHistorial> findByPedidoIdPedido(Integer idPedido);
}
