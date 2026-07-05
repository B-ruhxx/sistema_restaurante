package com.restaurante.service.policy;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.restaurante.entity.Empleado;
import com.restaurante.entity.Pedido;
import com.restaurante.entity.Rol;
import org.junit.jupiter.api.Test;

class PedidoPolicyTest {
    private final PedidoPolicy policy = new PedidoPolicy();

    @Test
    void noPermiteSaltoDeBorradorACerrado() {
        Pedido pedido = new Pedido();
        pedido.setEstado(Pedido.Estado.BORRADOR_ATENCION);

        assertThrows(IllegalStateException.class,
                () -> policy.validarTransicion(pedido, Pedido.Estado.CERRADO));
    }

    @Test
    void permiteTransicionDeCuentaACerrado() {
        Pedido pedido = new Pedido();
        pedido.setEstado(Pedido.Estado.CUENTA);

        assertDoesNotThrow(() -> policy.validarTransicion(pedido, Pedido.Estado.CERRADO));
    }

    @Test
    void cancelacionActivaRequiereSupervisor() {
        Pedido pedido = new Pedido();
        pedido.setEstado(Pedido.Estado.EN_COCINA);

        Empleado cajero = empleadoConRol("CAJERO");

        assertThrows(IllegalStateException.class,
                () -> policy.validarCancelacion(pedido, cajero, "Cliente se retiro"));
    }

    @Test
    void administradorPuedeCancelarPedidoActivoConMotivo() {
        Pedido pedido = new Pedido();
        pedido.setEstado(Pedido.Estado.EN_COCINA);

        Empleado admin = empleadoConRol("ADMINISTRADOR");

        assertDoesNotThrow(() -> policy.validarCancelacion(pedido, admin, "Cliente se retiro"));
    }

    private Empleado empleadoConRol(String nombreRol) {
        Rol rol = new Rol();
        rol.setNombre(nombreRol);
        Empleado empleado = new Empleado();
        empleado.setRol(rol);
        empleado.setIdEmpleado(1);
        return empleado;
    }
}
