package com.restaurante.service;

import com.restaurante.dto.mapper.ConfiguracionMapper;
import com.restaurante.dto.request.ConfiguracionRequest;
import com.restaurante.dto.response.ConfiguracionResponse;
import com.restaurante.entity.ConfiguracionEmpresa;
import com.restaurante.repository.ConfiguracionEmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class ConfiguracionEmpresaService {

    @Autowired
    private ConfiguracionEmpresaRepository configuracionEmpresaRepository;

    @Autowired
    private ConfiguracionMapper configuracionMapper;

    public ConfiguracionResponse getConfiguracion() {
        ConfiguracionEmpresa config = configuracionEmpresaRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    ConfiguracionEmpresa defConfig = new ConfiguracionEmpresa();
                    defConfig.setNombreEmpresa("Mi Restaurante");
                    defConfig.setRuc("20000000001");
                    defConfig.setMoneda("PEN");
                    defConfig.setIgv(new BigDecimal("18.00"));
                    defConfig.setSerieBoleta("B001");
                    defConfig.setSerieFactura("F001");
                    return configuracionEmpresaRepository.save(defConfig);
                });
        return configuracionMapper.toResponse(config);
    }

    @Transactional
    public ConfiguracionResponse updateConfiguracion(ConfiguracionRequest request) {
        ConfiguracionEmpresa existing = configuracionEmpresaRepository.findAll().stream().findFirst().orElse(null);
        ConfiguracionEmpresa config = configuracionMapper.toEntity(request);
        if (existing != null) {
            config.setIdConfiguracion(existing.getIdConfiguracion());
        }
        ConfiguracionEmpresa savedConfig = configuracionEmpresaRepository.save(config);
        return configuracionMapper.toResponse(savedConfig);
    }
}
