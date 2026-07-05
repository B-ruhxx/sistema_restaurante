package com.restaurante.service.policy;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.restaurante.dto.VentaPagoRequest;
import com.restaurante.entity.Cliente;
import com.restaurante.entity.Pedido;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class VentaPolicyTest {
    private final VentaPolicy policy = new VentaPolicy();

    @Test
    void soloPedidoEnCuentaEsCobrable() {
        Pedido pedido = new Pedido();
        pedido.setEstado(Pedido.Estado.SERVIDO);

        assertThrows(IllegalStateException.class, () -> policy.validarPedidoCobrable(pedido));
    }

    @Test
    void facturaRequiereRucValido() {
        Cliente cliente = new Cliente();
        cliente.setTipoDocumento(Cliente.TipoDocumento.DNI);
        cliente.setDocumentoIdentidad("12345678");

        assertThrows(IllegalArgumentException.class, () -> policy.validarFactura("FACTURA", cliente));
    }

    @Test
    void boletaNoRequiereRuc() {
        assertDoesNotThrow(() -> policy.validarFactura("BOLETA", null));
    }

    @Test
    void pagosSonObligatoriosYCubrenTotal() {
        assertThrows(IllegalArgumentException.class, () -> policy.validarPagosInformados(List.of()));
        assertThrows(IllegalArgumentException.class,
                () -> policy.validarMontoPagado(new BigDecimal("9.90"), new BigDecimal("10.00")));

        VentaPagoRequest pago = new VentaPagoRequest();
        pago.setIdMetodoPago(1);
        pago.setMonto(new BigDecimal("10.00"));
        assertDoesNotThrow(() -> policy.validarPagosInformados(List.of(pago)));
        assertDoesNotThrow(() -> policy.validarMontoPagado(new BigDecimal("10.00"), new BigDecimal("10.00")));
    }
}
