package com.restaurante.repository;

import com.restaurante.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    List<Producto> findByCategoriaIdCategoria(Integer idCategoria);
    List<Producto> findByEstado(Producto.Estado estado);
}
