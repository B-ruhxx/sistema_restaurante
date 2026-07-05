package com.restaurante.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurante.entity.LoteInsumo;
import com.restaurante.repository.LoteInsumoRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LoteInsumoServiceTest {

    @Mock
    private LoteInsumoRepository loteInsumoRepository;

    @InjectMocks
    private LoteInsumoService loteInsumoService;

    @Test
    void devolverALoteVencidoMantieneEstadoVencido() {
        LoteInsumo lote = lote(LocalDate.now().minusDays(1), new BigDecimal("1.000"), LoteInsumo.Estado.VENCIDO);

        loteInsumoService.devolverALote(lote, new BigDecimal("2.000"));

        assertEquals(LoteInsumo.Estado.VENCIDO, lote.getEstado());
        verify(loteInsumoRepository).save(lote);
    }

    @Test
    void devolverALoteVigenteConSaldoQuedaDisponible() {
        LoteInsumo lote = lote(LocalDate.now().plusDays(1), BigDecimal.ZERO, LoteInsumo.Estado.AGOTADO);

        loteInsumoService.devolverALote(lote, new BigDecimal("2.000"));

        assertEquals(LoteInsumo.Estado.DISPONIBLE, lote.getEstado());
        verify(loteInsumoRepository).save(lote);
    }

    @Test
    void devolverALoteAnuladoNoLoReactiva() {
        LoteInsumo lote = lote(LocalDate.now().plusDays(1), BigDecimal.ZERO, LoteInsumo.Estado.ANULADO);

        loteInsumoService.devolverALote(lote, new BigDecimal("2.000"));

        assertEquals(LoteInsumo.Estado.ANULADO, lote.getEstado());
        verify(loteInsumoRepository).save(lote);
    }

    private LoteInsumo lote(LocalDate fecha, BigDecimal disponible, LoteInsumo.Estado estado) {
        LoteInsumo lote = new LoteInsumo();
        lote.setFechaVencimiento(fecha);
        lote.setCantidadDisponible(disponible);
        lote.setEstado(estado);
        when(loteInsumoRepository.save(lote)).thenReturn(lote);
        return lote;
    }
}
