package com.restaurante.service;

import com.restaurante.entity.Caja;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.MovimientoCaja;
import com.restaurante.repository.CajaRepository;
import com.restaurante.repository.MovimientoCajaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CajaService {

    @Autowired
    private CajaRepository cajaRepository;

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    public Caja abrirCaja(Empleado empleado, BigDecimal montoApertura, String observacion) {
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

        return cajaRepository.save(caja);
    }

    public Caja cerrarCaja(Integer idCaja, BigDecimal montoCierre, String observacion) {
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

        return cajaRepository.save(caja);
    }

    public MovimientoCaja registrarMovimiento(Integer idCaja, MovimientoCaja.Tipo tipo, String concepto,
            BigDecimal monto) {
        if (monto.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El monto del movimiento debe ser mayor o igual a 0.");
        }

        Caja caja = cajaRepository.findById(idCaja)
                .orElseThrow(() -> new IllegalArgumentException("Caja no encontrada."));

        if (caja.getEstado() == Caja.Estado.CERRADA) {
            throw new IllegalStateException("No se pueden registrar movimientos en una caja cerrada.");
        }

        MovimientoCaja movimiento = new MovimientoCaja();
        movimiento.setCaja(caja);
        movimiento.setTipo(tipo);
        movimiento.setConcepto(concepto);
        movimiento.setMonto(monto);

        // Actualizar el saldo teórico del sistema en la caja
        if (tipo == MovimientoCaja.Tipo.INGRESO) {
            caja.setMontoSistema(caja.getMontoSistema().add(monto));
        } else {
            caja.setMontoSistema(caja.getMontoSistema().subtract(monto));
        }

        cajaRepository.save(caja);
        return movimientoCajaRepository.save(movimiento);
    }

    public Optional<Caja> obtenerCajaAbiertaParaEmpleado(Empleado empleado) {
        Optional<Caja> cajaPropia = cajaRepository.findByEmpleadoAndEstado(empleado, Caja.Estado.ABIERTA);
        if (cajaPropia.isPresent()) {
            return cajaPropia;
        }
        return cajaRepository.findFirstByEstadoOrderByFechaAperturaDesc(Caja.Estado.ABIERTA);
    }

    public List<MovimientoCaja> obtenerMovimientos(Integer idCaja) {
        return movimientoCajaRepository.findByCajaIdCaja(idCaja);
    }

    public List<Caja> obtenerHistorialCajas() {
        return cajaRepository.findAll();
    }
}