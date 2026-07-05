package com.restaurante.service;

import com.restaurante.dto.mapper.ProveedorMapper;
import com.restaurante.dto.request.ProveedorRequest;
import com.restaurante.dto.response.ProveedorResponse;
import com.restaurante.entity.Proveedor;
import com.restaurante.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private ProveedorMapper proveedorMapper;

    public List<ProveedorResponse> getAllProveedores() {
        return proveedorRepository.findAll().stream()
                .map(proveedorMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ProveedorResponse getProveedorById(Integer id) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado con ID: " + id));
        return proveedorMapper.toResponse(proveedor);
    }

    @Transactional
    public ProveedorResponse createProveedor(ProveedorRequest request) {
        Proveedor proveedor = proveedorMapper.toEntity(request);
        if (proveedor.getEstado() == null) {
            proveedor.setEstado(Proveedor.Estado.ACTIVO);
        }
        Proveedor savedProveedor = proveedorRepository.save(proveedor);
        return proveedorMapper.toResponse(savedProveedor);
    }

    @Transactional
    public ProveedorResponse updateProveedor(Integer id, ProveedorRequest request) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado con ID: " + id));

        proveedor.setRazonSocial(request.getRazonSocial());
        proveedor.setRuc(request.getRuc());
        proveedor.setTelefono(request.getTelefono());
        proveedor.setEmail(request.getEmail());
        proveedor.setDireccion(request.getDireccion());
        proveedor.setContacto(request.getContacto());
        if (request.getEstado() != null) {
            proveedor.setEstado(Proveedor.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        Proveedor savedProveedor = proveedorRepository.save(proveedor);
        return proveedorMapper.toResponse(savedProveedor);
    }

    @Transactional
    public void deleteProveedor(Integer id) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado con ID: " + id));
        proveedor.setEstado(Proveedor.Estado.INACTIVO);
        proveedorRepository.save(proveedor);
    }
}
