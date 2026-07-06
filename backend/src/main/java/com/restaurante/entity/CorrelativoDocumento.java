package com.restaurante.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "correlativo_documento",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tipo_comprobante", "serie"}))
public class CorrelativoDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_correlativo")
    private Integer idCorrelativo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_comprobante", nullable = false, columnDefinition = "ENUM('BOLETA','FACTURA','TICKET')")
    private Venta.TipoComprobante tipoComprobante;

    @Column(nullable = false, length = 10)
    private String serie;

    @Column(name = "ultimo_numero", nullable = false)
    private Integer ultimoNumero = 0;

    public CorrelativoDocumento() {}

    public Integer getIdCorrelativo() { return idCorrelativo; }
    public void setIdCorrelativo(Integer idCorrelativo) { this.idCorrelativo = idCorrelativo; }

    public Venta.TipoComprobante getTipoComprobante() { return tipoComprobante; }
    public void setTipoComprobante(Venta.TipoComprobante tipoComprobante) { this.tipoComprobante = tipoComprobante; }

    public String getSerie() { return serie; }
    public void setSerie(String serie) { this.serie = serie; }

    public Integer getUltimoNumero() { return ultimoNumero; }
    public void setUltimoNumero(Integer ultimoNumero) { this.ultimoNumero = ultimoNumero; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CorrelativoDocumento that = (CorrelativoDocumento) o;
        return Objects.equals(idCorrelativo, that.idCorrelativo);
    }

    @Override
    public int hashCode() { return Objects.hash(idCorrelativo); }
}
