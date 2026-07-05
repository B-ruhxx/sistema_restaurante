package com.restaurante.service;

import com.restaurante.entity.LoteProducto;
import com.restaurante.entity.Producto;
import com.restaurante.repository.LoteProductoRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoteProductoService {

    @Autowired
    private LoteProductoRepository loteProductoRepository;

    public record DescuentoLoteProducto(LoteProducto lote, Integer cantidad) {}

    @Transactional
    public List<DescuentoLoteProducto> descontarFifo(Producto producto, Integer cantidadNecesaria) {
        List<LoteProducto> lotes = loteProductoRepository
                .findDisponiblesFifo(
                        producto.getIdProducto(),
                        0,
                        LocalDate.now());

        int restante = cantidadNecesaria;
        List<DescuentoLoteProducto> descuentos = new ArrayList<>();

        for (LoteProducto lote : lotes) {
            if (restante <= 0) {
                break;
            }

            int disponible = lote.getCantidadDisponible();
            int usado = Math.min(disponible, restante);
            lote.setCantidadDisponible(disponible - usado);
            if (lote.getCantidadDisponible() == 0) {
                lote.setEstado(LoteProducto.Estado.AGOTADO);
            }
            loteProductoRepository.save(lote);
            descuentos.add(new DescuentoLoteProducto(lote, usado));
            restante -= usado;
        }

        if (restante > 0) {
            throw new IllegalStateException("No hay lotes suficientes para el producto " + producto.getNombre() + ".");
        }

        return descuentos;
    }

    @Transactional
    public void devolverALote(LoteProducto lote, Integer cantidad) {
        lote.setCantidadDisponible(lote.getCantidadDisponible() + cantidad);
        actualizarEstadoDespuesDevolver(lote);
        loteProductoRepository.save(lote);
    }

    private void actualizarEstadoDespuesDevolver(LoteProducto lote) {
        if (lote.getEstado() == LoteProducto.Estado.ANULADO) {
            return;
        }
        if (lote.getCantidadDisponible() == null || lote.getCantidadDisponible() <= 0) {
            lote.setEstado(LoteProducto.Estado.AGOTADO);
            return;
        }
        if (lote.getFechaVencimiento() != null && lote.getFechaVencimiento().isBefore(LocalDate.now())) {
            lote.setEstado(LoteProducto.Estado.VENCIDO);
            return;
        }
        lote.setEstado(LoteProducto.Estado.DISPONIBLE);
    }
}
