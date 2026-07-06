package com.restaurante.repository;

import com.restaurante.entity.CorrelativoDocumento;
import com.restaurante.entity.Venta;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CorrelativoDocumentoRepository extends JpaRepository<CorrelativoDocumento, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CorrelativoDocumento> findByTipoComprobanteAndSerie(Venta.TipoComprobante tipoComprobante, String serie);

    @Modifying
    @Query(value = """
            INSERT IGNORE INTO correlativo_documento (tipo_comprobante, serie, ultimo_numero)
            VALUES (:tipoComprobante, :serie, 0)
            """, nativeQuery = true)
    int insertarSiNoExiste(@Param("tipoComprobante") String tipoComprobante, @Param("serie") String serie);
}
