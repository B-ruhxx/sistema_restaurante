package com.restaurante.service;

import com.restaurante.entity.CorrelativoDocumento;
import com.restaurante.entity.Venta;
import com.restaurante.repository.CorrelativoDocumentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CorrelativoDocumentoService {

    @Autowired
    private CorrelativoDocumentoRepository correlativoDocumentoRepository;

    @Transactional
    public String generarNumero(Venta.TipoComprobante tipoComprobante, String serie) {
        correlativoDocumentoRepository.insertarSiNoExiste(tipoComprobante.name(), serie);

        CorrelativoDocumento correlativo = correlativoDocumentoRepository
                .findByTipoComprobanteAndSerie(tipoComprobante, serie)
                .orElseThrow(() -> new IllegalStateException("No se pudo inicializar el correlativo de venta."));

        correlativo.setUltimoNumero(correlativo.getUltimoNumero() + 1);
        correlativoDocumentoRepository.save(correlativo);

        return String.format("%06d", correlativo.getUltimoNumero());
    }
}
