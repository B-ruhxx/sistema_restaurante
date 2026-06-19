package com.restaurante.service;

import com.restaurante.dto.CompraRequest;
import com.restaurante.dto.DetalleCompraRequest;
import com.restaurante.dto.response.CompraResponse;
import com.restaurante.dto.mapper.CompraMapper;
import com.restaurante.entity.*;
import com.restaurante.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompraService {

    @Autowired
    private CompraInsumoRepository compraInsumoRepository;

    @Autowired
    private DetalleCompraInsumoRepository detalleCompraInsumoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private CompraMapper compraMapper;

    public CompraResponse registrarCompra(CompraRequest request, Empleado empleado) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La compra debe tener al menos un detalle.");
        }

        Proveedor proveedor = proveedorRepository.findById(request.getIdProveedor())
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado con ID: " + request.getIdProveedor()));

        CompraInsumo compra = new CompraInsumo();
        compra.setCodigoCompra(request.getCodigoCompra());
        compra.setProveedor(proveedor);
        compra.setEmpleado(empleado);
        compra.setObservacion(request.getObservacion());

        BigDecimal totalCalculado = BigDecimal.ZERO;
        List<DetalleCompraInsumo> detalles = new ArrayList<>();

        for (DetalleCompraRequest detReq : request.getDetalles()) {
            if (detReq.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("La cantidad del insumo debe ser mayor a 0.");
            }
            if (detReq.getPrecioUnitario().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("El precio unitario no puede ser negativo.");
            }

            Insumo insumo = insumoRepository.findById(detReq.getIdInsumo())
                    .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado con ID: " + detReq.getIdInsumo()));

            BigDecimal subtotal = detReq.getPrecioUnitario().multiply(detReq.getCantidad());

            DetalleCompraInsumo det = new DetalleCompraInsumo();
            det.setInsumo(insumo);
            det.setCantidad(detReq.getCantidad());
            det.setPrecioUnitario(detReq.getPrecioUnitario());
            det.setSubtotal(subtotal);

            detalles.add(det);
            totalCalculado = totalCalculado.add(subtotal);
        }

        // Calculate subtotal and IGV using default (18.00%)
        BigDecimal igvPorcentaje = new BigDecimal("18.00");
        BigDecimal cienMasIgv = BigDecimal.valueOf(100).add(igvPorcentaje);
        BigDecimal subtotalGravado = totalCalculado.multiply(BigDecimal.valueOf(100))
                .divide(cienMasIgv, 4, RoundingMode.HALF_UP);
        BigDecimal igv = totalCalculado.subtract(subtotalGravado).setScale(4, RoundingMode.HALF_UP);

        compra.setSubtotal(subtotalGravado.setScale(2, RoundingMode.HALF_UP));
        compra.setIgv(igv.setScale(2, RoundingMode.HALF_UP));
        compra.setTotal(totalCalculado.setScale(2, RoundingMode.HALF_UP));
        compra.setEstado(CompraInsumo.Estado.REGISTRADA);

        CompraInsumo compraGuardada = compraInsumoRepository.save(compra);

        for (DetalleCompraInsumo det : detalles) {
            det.setCompra(compraGuardada);
            
            // Recalculate weighted average cost (Costo Promedio Ponderado)
            Insumo insumo = det.getInsumo();
            BigDecimal stockActual = insumo.getStock();
            BigDecimal costoPromedioActual = insumo.getCostoPromedio();
            if (costoPromedioActual == null) {
                costoPromedioActual = BigDecimal.ZERO;
            }

            BigDecimal stockNuevo = stockActual.add(det.getCantidad());

            BigDecimal nuevoCostoPromedio;
            if (stockNuevo.compareTo(BigDecimal.ZERO) == 0) {
                nuevoCostoPromedio = BigDecimal.ZERO;
            } else {
                BigDecimal valorActual = stockActual.multiply(costoPromedioActual);
                BigDecimal valorNuevaCompra = det.getCantidad().multiply(det.getPrecioUnitario());
                nuevoCostoPromedio = valorActual.add(valorNuevaCompra).divide(stockNuevo, 4, RoundingMode.HALF_UP);
            }

            insumo.setStock(stockNuevo);
            insumo.setCostoPromedio(nuevoCostoPromedio.setScale(2, RoundingMode.HALF_UP));
            insumoRepository.save(insumo);

            detalleCompraInsumoRepository.save(det);

            // Register inventory entry movement
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
            mov.setInsumo(insumo);
            mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.ENTRADA);
            mov.setOrigen(MovimientoInventario.Origen.COMPRA);
            mov.setReferenciaId(compraGuardada.getIdCompra());
            mov.setCantidad(det.getCantidad());
            mov.setMotivo("Compra de insumo - Código: " + compraGuardada.getCodigoCompra());
            mov.setEmpleado(compraGuardada.getEmpleado());
            movimientoInventarioRepository.save(mov);
        }

        return mapToDetailedResponse(compraGuardada);
    }

    public CompraResponse anularCompra(Integer idCompra, Empleado empleadoAnulacion) {
        CompraInsumo compra = compraInsumoRepository.findById(idCompra)
                .orElseThrow(() -> new IllegalArgumentException("Compra no encontrada."));

        if (compra.getEstado() == CompraInsumo.Estado.ANULADA) {
            throw new IllegalStateException("La compra ya se encuentra anulada.");
        }

        List<DetalleCompraInsumo> detalles = detalleCompraInsumoRepository.findByCompraIdCompra(compra.getIdCompra());

        for (DetalleCompraInsumo det : detalles) {
            Insumo insumo = insumoRepository.findById(det.getInsumo().getIdInsumo())
                    .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado."));

            BigDecimal stockActual = insumo.getStock();
            // Validate if we have enough stock to revert
            if (stockActual.compareTo(det.getCantidad()) < 0) {
                throw new IllegalStateException("No se puede anular la compra. El stock actual de " + insumo.getNombre() + " (" + stockActual + ") es menor que la cantidad comprada (" + det.getCantidad() + ").");
            }

            BigDecimal stockNuevo = stockActual.subtract(det.getCantidad());
            
            // Recalculating the average cost when annulling
            BigDecimal costoPromedioActual = insumo.getCostoPromedio();
            if (costoPromedioActual == null) {
                costoPromedioActual = BigDecimal.ZERO;
            }

            BigDecimal nuevoCostoPromedio;
            if (stockNuevo.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal valorActual = stockActual.multiply(costoPromedioActual);
                BigDecimal valorCompra = det.getCantidad().multiply(det.getPrecioUnitario());
                BigDecimal valorRestante = valorActual.subtract(valorCompra);
                if (valorRestante.compareTo(BigDecimal.ZERO) < 0) {
                    valorRestante = BigDecimal.ZERO;
                }
                nuevoCostoPromedio = valorRestante.divide(stockNuevo, 4, RoundingMode.HALF_UP);
            } else {
                nuevoCostoPromedio = BigDecimal.ZERO;
            }

            insumo.setStock(stockNuevo);
            insumo.setCostoPromedio(nuevoCostoPromedio.setScale(2, RoundingMode.HALF_UP));
            insumoRepository.save(insumo);

            // Register inventory movement for annulment (SALIDA)
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoRecurso(MovimientoInventario.TipoRecurso.INSUMO);
            mov.setInsumo(insumo);
            mov.setTipoMovimiento(MovimientoInventario.TipoMovimiento.SALIDA);
            mov.setOrigen(MovimientoInventario.Origen.ANULACION);
            mov.setReferenciaId(compra.getIdCompra());
            mov.setCantidad(det.getCantidad());
            mov.setMotivo("Anulación de compra - Código: " + compra.getCodigoCompra());
            mov.setEmpleado(empleadoAnulacion);
            movimientoInventarioRepository.save(mov);
        }

        compra.setEstado(CompraInsumo.Estado.ANULADA);
        CompraInsumo compraAnulada = compraInsumoRepository.save(compra);
        return mapToDetailedResponse(compraAnulada);
    }

    @Transactional(readOnly = true)
    public Optional<CompraResponse> obtenerCompraPorId(Integer id) {
        return compraInsumoRepository.findById(id).map(this::mapToDetailedResponse);
    }

    @Transactional(readOnly = true)
    public List<CompraResponse> listarCompras() {
        return compraInsumoRepository.findAll().stream()
                .map(this::mapToDetailedResponse)
                .collect(Collectors.toList());
    }

    private CompraResponse mapToDetailedResponse(CompraInsumo compra) {
        List<DetalleCompraInsumo> detalles = detalleCompraInsumoRepository.findByCompraIdCompra(compra.getIdCompra());
        return compraMapper.toResponse(compra, detalles);
    }
}
