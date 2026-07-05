package com.restaurante.service;

import com.restaurante.dto.mapper.CajaMapper;
import com.restaurante.dto.response.CajaResponse;
import com.restaurante.dto.response.MovimientoCajaResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.entity.Caja;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.MovimientoCaja;
import com.restaurante.entity.Venta;
import com.restaurante.repository.CajaRepository;
import com.restaurante.repository.MovimientoCajaRepository;
import com.restaurante.repository.VentaRepository;
import com.restaurante.service.policy.CajaPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CajaService {

    @Autowired
    private CajaRepository cajaRepository;

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private CajaMapper cajaMapper;

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private CajaPolicy cajaPolicy;

    public CajaResponse abrirCaja(Empleado empleado, BigDecimal montoApertura, String observacion) {
        // Validar si el empleado ya cuenta con una caja abierta
        Optional<Caja> cajaAbiertaOpt = cajaRepository.findByEmpleadoAndEstado(empleado, Caja.Estado.ABIERTA);
        if (cajaAbiertaOpt.isPresent()) {
            throw new IllegalStateException("El empleado ya tiene una caja abierta.");
        }

        Caja caja = new Caja();
        caja.setEmpleado(empleado);
        caja.setEstado(Caja.Estado.ABIERTA);
        caja.setMontoApertura(montoApertura);
        caja.setMontoSistema(montoApertura);
        caja.setObservacion(observacion);

        Caja savedCaja = cajaRepository.save(caja);
        return toResponseConTotales(savedCaja);
    }

    public CajaResponse cerrarCaja(Integer idCaja, BigDecimal montoCierre, String observacion) {
        Caja caja = cajaRepository.findById(idCaja)
                .orElseThrow(() -> new IllegalArgumentException("Caja no encontrada."));

        if (caja.getEstado() == Caja.Estado.CERRADA) {
            throw new IllegalStateException("La caja ya está cerrada.");
        }

        caja.setEstado(Caja.Estado.CERRADA);
        caja.setMontoCierre(montoCierre);
        caja.setFechaCierre(LocalDateTime.now());
        caja.setObservacion(observacion);

        // Calcular la diferencia en caja
        BigDecimal diferencia = montoCierre.subtract(caja.getMontoSistema());
        caja.setDiferencia(diferencia);

        Caja savedCaja = cajaRepository.save(caja);
        return toResponseConTotales(savedCaja);
    }

    public MovimientoCajaResponse registrarMovimiento(Integer idCaja, MovimientoCaja.Tipo tipo, String concepto,
            BigDecimal monto, Empleado empleado, String referenceType, Integer referenceId, String comprobante) {
        Caja caja = cajaRepository.findById(idCaja)
                .orElseThrow(() -> new IllegalArgumentException("Caja no encontrada."));
        cajaPolicy.validarMovimiento(caja, tipo, monto, empleado, referenceType, referenceId, comprobante);

        MovimientoCaja movimiento = new MovimientoCaja();
        movimiento.setCaja(caja);
        movimiento.setTipo(tipo);
        movimiento.setConcepto(concepto);
        movimiento.setMonto(monto);
        movimiento.setEmpleado(empleado);
        movimiento.setReferenceType(referenceType.trim().toUpperCase());
        movimiento.setReferenceId(referenceId);
        movimiento.setComprobante(comprobante.trim());

        // Actualizar el saldo teórico del sistema en la caja
        if (tipo == MovimientoCaja.Tipo.INGRESO) {
            caja.setMontoSistema(caja.getMontoSistema().add(monto));
        } else {
            caja.setMontoSistema(caja.getMontoSistema().subtract(monto));
        }

        cajaRepository.save(caja);
        MovimientoCaja savedMov = movimientoCajaRepository.save(movimiento);
        return cajaMapper.toResponse(savedMov);
    }

    public Optional<CajaResponse> obtenerCajaAbiertaParaEmpleado(Empleado empleado) {
        Optional<Caja> cajaPropia = cajaRepository.findByEmpleadoAndEstado(empleado, Caja.Estado.ABIERTA);
        if (cajaPropia.isPresent()) {
            return cajaPropia.map(this::toResponseConTotales);
        }
        return cajaRepository.findFirstByEstadoOrderByFechaAperturaDesc(Caja.Estado.ABIERTA)
                .map(this::toResponseConTotales);
    }

    public List<MovimientoCajaResponse> obtenerMovimientos(Integer idCaja) {
        return movimientoCajaRepository.findByCajaIdCajaOrderByFechaDescIdMovimientoDesc(idCaja).stream()
                .map(cajaMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<CajaResponse> obtenerHistorialCajas() {
        return cajaRepository.findAll().stream()
                .map(this::toResponseConTotales)
                .collect(Collectors.toList());
    }

    private CajaResponse toResponseConTotales(Caja caja) {
        CajaResponse response = cajaMapper.toResponse(caja);
        BigDecimal montoVentas = ventaRepository.sumTotalByCajaIdAndEstado(caja.getIdCaja(), Venta.Estado.EMITIDA);

        BigDecimal montoIngresos = movimientoCajaRepository.sumMontoByCajaIdAndTipo(caja.getIdCaja(), MovimientoCaja.Tipo.INGRESO);
        BigDecimal montoEgresos = movimientoCajaRepository.sumMontoByCajaIdAndTipo(caja.getIdCaja(), MovimientoCaja.Tipo.EGRESO);

        response.setMontoVentas(montoVentas);
        response.setMontoIngresos(montoIngresos);
        response.setMontoEgresos(montoEgresos);
        response.setSaldoEsperado(caja.getMontoSistema() != null ? caja.getMontoSistema() : BigDecimal.ZERO);
        return response;
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> obtenerPedidosPendientesCobro() {
        return pedidoService.listarPedidosCobrables();
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> obtenerPedidosCobrablesPorMesa(Integer idMesa) {
        return pedidoService.obtenerPedidosCobrablesPorMesa(idMesa);
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> buscarPedidosParaCaja(String query) {
        return pedidoService.buscarPedidosParaCaja(query);
    }
}
