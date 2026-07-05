package com.restaurante.service;

import com.restaurante.entity.Insumo;
import com.restaurante.entity.LoteInsumo;
import com.restaurante.repository.LoteInsumoRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoteInsumoService {

    @Autowired
    private LoteInsumoRepository loteInsumoRepository;

    public record DescuentoLote(LoteInsumo lote, BigDecimal cantidad) {}

    @Transactional
    public List<DescuentoLote> descontarFifo(Insumo insumo, BigDecimal cantidadNecesaria) {
        List<LoteInsumo> lotes = loteInsumoRepository
                .findByInsumoIdInsumoAndCantidadDisponibleGreaterThanOrderByFechaVencimientoAscIdLoteInsumoAsc(
                        insumo.getIdInsumo(),
                        BigDecimal.ZERO);

        BigDecimal restante = cantidadNecesaria;
        List<DescuentoLote> descuentos = new ArrayList<>();

        for (LoteInsumo lote : lotes) {
            if (restante.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal disponible = lote.getCantidadDisponible();
            BigDecimal usado = disponible.min(restante);
            lote.setCantidadDisponible(disponible.subtract(usado));
            if (lote.getCantidadDisponible().compareTo(BigDecimal.ZERO) == 0) {
                lote.setEstado(LoteInsumo.Estado.AGOTADO);
            }
            loteInsumoRepository.save(lote);
            descuentos.add(new DescuentoLote(lote, usado));
            restante = restante.subtract(usado);
        }

        if (restante.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("No hay lotes suficientes para el insumo " + insumo.getNombre() + ".");
        }

        return descuentos;
    }

    @Transactional
    public void devolverALote(LoteInsumo lote, BigDecimal cantidad) {
        lote.setCantidadDisponible(lote.getCantidadDisponible().add(cantidad));
        lote.setEstado(LoteInsumo.Estado.DISPONIBLE);
        loteInsumoRepository.save(lote);
    }
}
