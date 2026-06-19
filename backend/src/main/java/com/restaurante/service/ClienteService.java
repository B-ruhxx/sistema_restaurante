package com.restaurante.service;

import com.restaurante.dto.mapper.ClienteMapper;
import com.restaurante.dto.request.ClienteRequest;
import com.restaurante.dto.response.ClienteResponse;
import com.restaurante.entity.Cliente;
import com.restaurante.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ClienteMapper clienteMapper;

    public List<ClienteResponse> getAllClientes() {
        return clienteRepository.findAll().stream()
                .map(clienteMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ClienteResponse getClienteById(Integer id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));
        return clienteMapper.toResponse(cliente);
    }

    @Transactional
    public ClienteResponse createCliente(ClienteRequest request) {
        Cliente cliente = clienteMapper.toEntity(request);
        if (cliente.getEstado() == null) {
            cliente.setEstado(Cliente.Estado.ACTIVO);
        }
        Cliente savedCliente = clienteRepository.save(cliente);
        return clienteMapper.toResponse(savedCliente);
    }

    @Transactional
    public ClienteResponse updateCliente(Integer id, ClienteRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));

        cliente.setNombre(request.getNombre());
        cliente.setApellido(request.getApellido());
        if (request.getTipoDocumento() != null) {
            cliente.setTipoDocumento(Cliente.TipoDocumento.valueOf(request.getTipoDocumento().toUpperCase()));
        }
        cliente.setDocumentoIdentidad(request.getDocumentoIdentidad());
        cliente.setTelefono(request.getTelefono());
        cliente.setEmail(request.getEmail());
        cliente.setDireccion(request.getDireccion());
        if (request.getEstado() != null) {
            cliente.setEstado(Cliente.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        Cliente savedCliente = clienteRepository.save(cliente);
        return clienteMapper.toResponse(savedCliente);
    }

    @Transactional
    public void deleteCliente(Integer id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));
        cliente.setEstado(Cliente.Estado.INACTIVO);
        clienteRepository.save(cliente);
    }
}
