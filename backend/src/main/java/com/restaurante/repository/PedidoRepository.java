package com.restaurante.repository;

import com.restaurante.entity.Pedido;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    List<Pedido> findByEstadoIn(List<Pedido.Estado> estados);
    List<Pedido> findByEstado(Pedido.Estado estado);
    List<Pedido> findByMesaIdMesa(Integer idMesa);
    List<Pedido> findByMesaIdMesaAndEstadoIn(Integer idMesa, Collection<Pedido.Estado> estados);
    Optional<Pedido> findFirstByMesaIdMesaAndEstadoInOrderByFechaDesc(Integer idMesa, Collection<Pedido.Estado> estados);
    boolean existsByMesaIdMesaAndEstadoIn(Integer idMesa, Collection<Pedido.Estado> estados);

    @Query("""
            select distinct p from Pedido p
            left join p.mesa m
            left join p.cliente c
            where p.estado in :estados
              and (
                lower(c.nombre) like lower(concat('%', :query, '%'))
                or lower(c.apellido) like lower(concat('%', :query, '%'))
                or c.documentoIdentidad like concat('%', :query, '%')
                or m.numero like concat('%', :query, '%')
              )
            """)
    List<Pedido> buscarParaCaja(@Param("query") String query, @Param("estados") Collection<Pedido.Estado> estados);
}
