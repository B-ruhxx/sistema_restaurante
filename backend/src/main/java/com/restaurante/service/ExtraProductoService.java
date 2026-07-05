package com.restaurante.service;

import com.restaurante.dto.mapper.ExtraProductoMapper;
import com.restaurante.dto.request.ExtraProductoRequest;
import com.restaurante.dto.response.ExtraProductoResponse;
import com.restaurante.entity.ExtraProducto;
import com.restaurante.entity.Insumo;
import com.restaurante.repository.ExtraProductoRepository;
import com.restaurante.repository.InsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExtraProductoService {

    @Autowired
    private ExtraProductoRepository extraProductoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ExtraProductoMapper extraProductoMapper;

    public List<ExtraProductoResponse> getAllExtras() {
        return extraProductoRepository.findAll().stream()
                .map(extraProductoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ExtraProductoResponse getExtraById(Integer id) {
        ExtraProducto ep = extraProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado con ID: " + id));
        return extraProductoMapper.toResponse(ep);
    }

    @Transactional
    public ExtraProductoResponse createExtra(ExtraProductoRequest request) {
        ExtraProducto ep = extraProductoMapper.toEntity(request);
        ep.setInsumo(validarInsumoConsumible(request.getIdInsumo()));
        validarCantidadConsumida(request.getCantidadConsumida());
        if (ep.getEstado() == null) {
            ep.setEstado(ExtraProducto.Estado.ACTIVO);
        }
        ExtraProducto savedEp = extraProductoRepository.save(ep);
        return extraProductoMapper.toResponse(savedEp);
    }

    @Transactional
    public ExtraProductoResponse updateExtra(Integer id, ExtraProductoRequest request) {
        ExtraProducto ep = extraProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado con ID: " + id));

        ep.setNombre(request.getNombre());
        ep.setPrecio(request.getPrecio());
        ep.setInsumo(validarInsumoConsumible(request.getIdInsumo()));
        validarCantidadConsumida(request.getCantidadConsumida());
        ep.setCantidadConsumida(request.getCantidadConsumida());
        if (request.getEstado() != null) {
            ep.setEstado(ExtraProducto.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        ExtraProducto savedEp = extraProductoRepository.save(ep);
        return extraProductoMapper.toResponse(savedEp);
    }

    @Transactional
    public void deleteExtra(Integer id) {
        ExtraProducto ep = extraProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado con ID: " + id));
        ep.setEstado(ExtraProducto.Estado.INACTIVO);
        extraProductoRepository.save(ep);
    }

    private Insumo validarInsumoConsumible(Integer idInsumo) {
        if (idInsumo == null) {
            throw new IllegalArgumentException("El insumo consumido es obligatorio.");
        }
        Insumo insumo = insumoRepository.findById(idInsumo)
                .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado: ID " + idInsumo));
        if (insumo.getEstado() != Insumo.Estado.ACTIVO) {
            throw new IllegalArgumentException("El insumo asociado al extra debe estar activo.");
        }
        return insumo;
    }

    private void validarCantidadConsumida(BigDecimal cantidadConsumida) {
        if (cantidadConsumida == null || cantidadConsumida.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La cantidad consumida debe ser mayor a 0.");
        }
    }
}
