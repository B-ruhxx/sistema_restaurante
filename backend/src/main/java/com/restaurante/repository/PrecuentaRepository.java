package com.restaurante.repository;

import com.restaurante.entity.Precuenta;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrecuentaRepository extends JpaRepository<Precuenta, Integer> {
    List<Precuenta> findByPedidoIdPedidoOrderByFechaEmisionDesc(Integer idPedido);
    Optional<Precuenta> findFirstByPedidoIdPedidoOrderByFechaEmisionDesc(Integer idPedido);
    Optional<Precuenta> findByNumero(String numero);
}
