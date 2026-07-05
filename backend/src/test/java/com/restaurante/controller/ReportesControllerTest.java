package com.restaurante.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.restaurante.dto.AlertaStockDto;
import com.restaurante.dto.StockInsuficienteDto;
import com.restaurante.service.ReporteService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class ReportesControllerTest {

    @Mock
    private ReporteService reporteService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ReportesController controller = new ReportesController();
        ReflectionTestUtils.setField(controller, "reporteService", reporteService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getAlertaStockRetornaItems() throws Exception {
        when(reporteService.obtenerAlertaStock()).thenReturn(List.of(
                new AlertaStockDto("Agua 500ml", 3, 5, "PRODUCTO_DIRECTO")));

        mockMvc.perform(get("/api/v1/reportes/alerta-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Agua 500ml"))
                .andExpect(jsonPath("$[0].stock").value(3))
                .andExpect(jsonPath("$[0].stockMinimo").value(5))
                .andExpect(jsonPath("$[0].tipoRecurso").value("PRODUCTO_DIRECTO"));
    }

    @Test
    void getStockInsuficienteRetornaItems() throws Exception {
        when(reporteService.obtenerStockInsuficiente()).thenReturn(List.of(
                new StockInsuficienteDto("Pan ciabatta", "Harina", new BigDecimal("2.000"), new BigDecimal("5.000"))));

        mockMvc.perform(get("/api/v1/reportes/stock-insuficiente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].producto").value("Pan ciabatta"))
                .andExpect(jsonPath("$[0].insumo").value("Harina"))
                .andExpect(jsonPath("$[0].stock").value(2.000))
                .andExpect(jsonPath("$[0].cantidadNecesaria").value(5.000));
    }
}
