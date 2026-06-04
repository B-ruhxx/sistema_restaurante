package com.restaurante.repository;

import com.restaurante.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    List<Pedido> findByEstadoIn(List<Pedido.Estado> estados);
    List<Pedido> findByEstado(Pedido.Estado estado);
}
