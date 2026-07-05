package com.restaurante.repository;

import com.restaurante.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    List<Categoria> findByEstado(Categoria.Estado estado);
    List<Categoria> findAllByOrderByNombreAsc();
    List<Categoria> findByEstadoOrderByNombreAsc(Categoria.Estado estado);
}
