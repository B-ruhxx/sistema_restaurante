package com.restaurante.controller;

import com.restaurante.dto.AlertaStockDto;
import com.restaurante.dto.StockInsuficienteDto;
import com.restaurante.dto.response.CompraDiariaResponse;
import com.restaurante.dto.response.ProductoPopularResponse;
import com.restaurante.dto.response.ResumenFinancieroResponse;
import com.restaurante.dto.response.UtilidadDiariaResponse;
import com.restaurante.dto.response.VentaDiariaResponse;
import com.restaurante.dto.response.VentaPorHoraResponse;
import com.restaurante.service.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reportes")
public class ReportesController {

    @Autowired
    private ReporteService reporteService;

    @GetMapping("/stock-insuficiente")
    public ResponseEntity<List<StockInsuficienteDto>> getStockInsuficiente() {
        try {
            return ResponseEntity.ok(reporteService.obtenerStockInsuficiente());
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/alerta-stock")
    public ResponseEntity<List<AlertaStockDto>> getAlertaStock() {
        try {
            return ResponseEntity.ok(reporteService.obtenerAlertaStock());
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/ventas-diarias")
    public ResponseEntity<List<VentaDiariaResponse>> getVentasDiarias() {
        try {
            List<VentaDiariaResponse> response = reporteService.obtenerVentasDiarias();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/compras-diarias")
    public ResponseEntity<List<CompraDiariaResponse>> getComprasDiarias() {
        try {
            List<CompraDiariaResponse> response = reporteService.obtenerComprasDiarias();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/utilidad-diaria")
    public ResponseEntity<List<UtilidadDiariaResponse>> getUtilidadDiaria() {
        try {
            return ResponseEntity.ok(reporteService.obtenerUtilidadDiaria());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/ventas-por-hora")
    public ResponseEntity<List<VentaPorHoraResponse>> getVentasPorHora(@RequestParam(required = false) String fecha) {
        try {
            List<VentaPorHoraResponse> response = reporteService.obtenerVentasPorHora(fecha);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/productos-populares")
    public ResponseEntity<List<ProductoPopularResponse>> getProductosPopulares() {
        try {
            List<ProductoPopularResponse> response = reporteService.obtenerProductosPopulares();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen-financiero")
    public ResponseEntity<ResumenFinancieroResponse> getResumenFinanciero() {
        try {
            ResumenFinancieroResponse response = reporteService.obtenerResumenFinanciero();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
