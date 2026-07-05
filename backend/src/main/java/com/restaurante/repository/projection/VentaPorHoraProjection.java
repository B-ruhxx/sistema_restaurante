package com.restaurante.repository.projection;

import java.math.BigDecimal;

public interface VentaPorHoraProjection {
    Integer getHora();
    BigDecimal getTotal();
    Long getCantidad();
}
