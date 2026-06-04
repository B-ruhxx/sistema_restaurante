package com.restaurante.repository;

import com.restaurante.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    Optional<Cliente> findByDocumentoIdentidad(String documentoIdentidad);
    List<Cliente> findByEstado(Cliente.Estado estado);
}
