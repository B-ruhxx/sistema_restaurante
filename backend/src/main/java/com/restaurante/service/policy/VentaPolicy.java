package com.restaurante.service.policy;

import com.restaurante.dto.VentaPagoRequest;
import com.restaurante.entity.Caja;
import com.restaurante.entity.Cliente;
import com.restaurante.entity.Pedido;
import com.restaurante.entity.Venta;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class VentaPolicy {

    public void validarPedidoCobrable(Pedido pedido) {
        if (pedido == null) {
            throw new IllegalArgumentException("Pedido no encontrado.");
        }
        if (pedido.getEstado() != Pedido.Estado.CUENTA) {
            throw new IllegalStateException("Solo se pueden cobrar pedidos en estado CUENTA.");
        }
    }

    public void validarFactura(String tipoComprobante, Cliente cliente) {
        if (!"FACTURA".equalsIgnoreCase(tipoComprobante)) {
            return;
        }
        if (cliente == null
                || cliente.getTipoDocumento() != Cliente.TipoDocumento.RUC
                || cliente.getDocumentoIdentidad() == null
                || !cliente.getDocumentoIdentidad().matches("\\d{11}")) {
            throw new IllegalArgumentException("Para emitir factura el cliente debe tener RUC válido.");
        }
    }

    public void validarPagosInformados(List<VentaPagoRequest> pagosReq) {
        if (pagosReq == null || pagosReq.isEmpty()) {
            throw new IllegalArgumentException("Debe registrar al menos un pago.");
        }
    }

    public void validarMontoPagado(BigDecimal totalPagos, BigDecimal totalVenta) {
        if (totalPagos == null || totalVenta == null || totalPagos.compareTo(totalVenta) < 0) {
            throw new IllegalArgumentException("El monto pagado es insuficiente.");
        }
    }

    public void validarVentaPagable(Venta venta) {
        if (venta == null) {
            throw new IllegalArgumentException("Venta no encontrada.");
        }
        if (venta.getEstado() != Venta.Estado.EMITIDA) {
            throw new IllegalStateException("La venta no está en estado EMITIDA.");
        }
        Caja caja = venta.getCaja();
        if (caja == null || caja.getEstado() != Caja.Estado.ABIERTA) {
            throw new IllegalStateException("La caja asociada a esta venta ya no se encuentra abierta.");
        }
    }

    public void validarAnulable(Venta venta, String motivo) {
        if (venta == null) {
            throw new IllegalArgumentException("Venta no encontrada.");
        }
        if (venta.getEstado() == Venta.Estado.ANULADA) {
            throw new IllegalStateException("La venta ya está anulada.");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo de anulación es obligatorio.");
        }
    }
}
