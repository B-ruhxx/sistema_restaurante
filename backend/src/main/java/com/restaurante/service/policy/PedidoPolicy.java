package com.restaurante.service.policy;

import com.restaurante.entity.Empleado;
import com.restaurante.entity.Pedido;
import com.restaurante.entity.Permiso;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class PedidoPolicy {
    private static final Map<Pedido.Estado, Set<Pedido.Estado>> TRANSICIONES = Map.of(
            Pedido.Estado.BORRADOR_ATENCION, Set.of(Pedido.Estado.EN_COCINA, Pedido.Estado.SERVIDO, Pedido.Estado.CANCELADO),
            Pedido.Estado.EN_COCINA, Set.of(Pedido.Estado.LISTO, Pedido.Estado.CANCELADO),
            Pedido.Estado.LISTO, Set.of(Pedido.Estado.SERVIDO, Pedido.Estado.CANCELADO),
            Pedido.Estado.SERVIDO, Set.of(Pedido.Estado.CUENTA, Pedido.Estado.CANCELADO),
            Pedido.Estado.CUENTA, Set.of(Pedido.Estado.CERRADO, Pedido.Estado.CANCELADO),
            Pedido.Estado.CERRADO, Set.of(),
            Pedido.Estado.CANCELADO, Set.of());

    public void validarTransicion(Pedido pedido, Pedido.Estado nuevoEstado) {
        if (pedido == null || pedido.getEstado() == null || nuevoEstado == null) {
            throw new IllegalArgumentException("Pedido y estado destino son obligatorios.");
        }
        if (pedido.getEstado() == nuevoEstado) {
            return;
        }
        if (!TRANSICIONES.getOrDefault(pedido.getEstado(), Set.of()).contains(nuevoEstado)) {
            throw new IllegalStateException(
                    "Transición de pedido no permitida: " + pedido.getEstado() + " -> " + nuevoEstado + ".");
        }
    }

    public void validarCancelacion(Pedido pedido, Empleado empleado, String motivo) {
        if (pedido.getEstado() == Pedido.Estado.CERRADO || pedido.getEstado() == Pedido.Estado.CANCELADO) {
            throw new IllegalStateException("No se puede cancelar un pedido " + pedido.getEstado() + ".");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo de cancelación es obligatorio.");
        }
        if (!esSupervisor(empleado)) {
            throw new IllegalStateException("La cancelación de un pedido activo requiere supervisor.");
        }
    }

    public boolean esSupervisor(Empleado empleado) {
        if (empleado == null || empleado.getRol() == null) {
            return false;
        }
        String rol = empleado.getRol().getNombre() != null
                ? empleado.getRol().getNombre().trim().toUpperCase()
                : "";
        if (rol.equals("ADMINISTRADOR") || rol.equals("SUPERVISOR")) {
            return true;
        }
        Set<String> permisos = empleado.getRol().getPermisos().stream()
                .map(Permiso::getNombre)
                .filter(nombre -> nombre != null)
                .map(nombre -> nombre.trim().toUpperCase())
                .collect(Collectors.toSet());
        return permisos.contains("ACCESO_TOTAL");
    }
}
