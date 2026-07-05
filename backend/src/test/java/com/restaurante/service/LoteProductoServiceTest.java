package com.restaurante.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurante.entity.LoteProducto;
import com.restaurante.repository.LoteProductoRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LoteProductoServiceTest {

    @Mock
    private LoteProductoRepository loteProductoRepository;

    @InjectMocks
    private LoteProductoService loteProductoService;

    @Test
    void devolverALoteVencidoMantieneEstadoVencido() {
        LoteProducto lote = lote(LocalDate.now().minusDays(1), 1, LoteProducto.Estado.VENCIDO);

        loteProductoService.devolverALote(lote, 2);

        assertEquals(LoteProducto.Estado.VENCIDO, lote.getEstado());
        verify(loteProductoRepository).save(lote);
    }

    @Test
    void devolverALoteVigenteConSaldoQuedaDisponible() {
        LoteProducto lote = lote(LocalDate.now().plusDays(1), 0, LoteProducto.Estado.AGOTADO);

        loteProductoService.devolverALote(lote, 2);

        assertEquals(LoteProducto.Estado.DISPONIBLE, lote.getEstado());
        verify(loteProductoRepository).save(lote);
    }

    @Test
    void devolverALoteAnuladoNoLoReactiva() {
        LoteProducto lote = lote(LocalDate.now().plusDays(1), 0, LoteProducto.Estado.ANULADO);

        loteProductoService.devolverALote(lote, 2);

        assertEquals(LoteProducto.Estado.ANULADO, lote.getEstado());
        verify(loteProductoRepository).save(lote);
    }

    private LoteProducto lote(LocalDate fecha, Integer disponible, LoteProducto.Estado estado) {
        LoteProducto lote = new LoteProducto();
        lote.setFechaVencimiento(fecha);
        lote.setCantidadDisponible(disponible);
        lote.setEstado(estado);
        when(loteProductoRepository.save(lote)).thenReturn(lote);
        return lote;
    }
}
