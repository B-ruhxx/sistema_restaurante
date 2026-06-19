package com.restaurante.dto.mapper;

import com.restaurante.dto.request.ClienteRequest;
import com.restaurante.dto.response.ClienteResponse;
import com.restaurante.entity.Cliente;
import org.springframework.stereotype.Component;

@Component
public class ClienteMapper {

    public ClienteResponse toResponse(Cliente entity) {
        if (entity == null) return null;
        ClienteResponse dto = new ClienteResponse();
        dto.setIdCliente(entity.getIdCliente());
        dto.setNombre(entity.getNombre());
        dto.setApellido(entity.getApellido());
        if (entity.getTipoDocumento() != null) {
            dto.setTipoDocumento(entity.getTipoDocumento().name());
        }
        dto.setDocumentoIdentidad(entity.getDocumentoIdentidad());
        dto.setTelefono(entity.getTelefono());
        dto.setEmail(entity.getEmail());
        dto.setDireccion(entity.getDireccion());
        if (entity.getEstado() != null) {
            dto.setEstado(entity.getEstado().name());
        }
        return dto;
    }

    public Cliente toEntity(ClienteRequest request) {
        if (request == null) return null;
        Cliente entity = new Cliente();
        entity.setNombre(request.getNombre());
        entity.setApellido(request.getApellido());
        if (request.getTipoDocumento() != null) {
            entity.setTipoDocumento(Cliente.TipoDocumento.valueOf(request.getTipoDocumento()));
        }
        entity.setDocumentoIdentidad(request.getDocumentoIdentidad());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        entity.setDireccion(request.getDireccion());
        if (request.getEstado() != null) {
            entity.setEstado(Cliente.Estado.valueOf(request.getEstado()));
        }
        return entity;
    }
}
