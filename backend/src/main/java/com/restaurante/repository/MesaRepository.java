package com.restaurante.repository;

import com.restaurante.entity.Mesa;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MesaRepository extends JpaRepository<Mesa, Integer> {
    List<Mesa> findByEstado(Mesa.Estado estado);
    Optional<Mesa> findByNumero(String numero);
}
