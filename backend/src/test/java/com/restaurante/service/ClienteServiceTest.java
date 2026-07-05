package com.restaurante.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.restaurante.dto.mapper.ClienteMapper;
import com.restaurante.dto.request.ClienteRequest;
import com.restaurante.dto.response.ClienteResponse;
import com.restaurante.entity.Cliente;
import com.restaurante.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private ClienteMapper clienteMapper;

    @InjectMocks
    private ClienteService clienteService;

    private ClienteRequest request;
    private Cliente mappedCliente;
    private Cliente savedCliente;
    private ClienteResponse response;

    @BeforeEach
    void setUp() {
        request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");

        mappedCliente = new Cliente();
        mappedCliente.setNombre("Juan");
        mappedCliente.setApellido("Perez");

        savedCliente = new Cliente();
        savedCliente.setIdCliente(1);
        savedCliente.setNombre("Juan");
        savedCliente.setApellido("Perez");
        savedCliente.setEstado(Cliente.Estado.ACTIVO);

        response = new ClienteResponse();
        response.setIdCliente(1);
        response.setNombre("Juan");
        response.setApellido("Perez");
        response.setEstado("ACTIVO");
    }

    @Test
    void createDniConDocumentoPersistido() {
        request.setTipoDocumento("DNI");
        request.setDocumentoIdentidad("12345678");
        mappedCliente.setTipoDocumento(Cliente.TipoDocumento.DNI);
        mappedCliente.setDocumentoIdentidad("12345678");
        savedCliente.setTipoDocumento(Cliente.TipoDocumento.DNI);
        savedCliente.setDocumentoIdentidad("12345678");

        when(clienteMapper.toEntity(request)).thenReturn(mappedCliente);
        when(clienteRepository.save(any())).thenReturn(savedCliente);
        when(clienteMapper.toResponse(savedCliente)).thenReturn(response);

        clienteService.createCliente(request);

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        Cliente persisted = captor.getValue();
        assertEquals(Cliente.TipoDocumento.DNI, persisted.getTipoDocumento());
        assertEquals("12345678", persisted.getDocumentoIdentidad());
    }

    @Test
    void createSinDocumentoConNullPersistidoComoNull() {
        request.setTipoDocumento("SIN_DOCUMENTO");
        request.setDocumentoIdentidad(null);
        mappedCliente.setTipoDocumento(Cliente.TipoDocumento.SIN_DOCUMENTO);
        mappedCliente.setDocumentoIdentidad(null);
        savedCliente.setTipoDocumento(Cliente.TipoDocumento.SIN_DOCUMENTO);
        savedCliente.setDocumentoIdentidad(null);

        when(clienteMapper.toEntity(request)).thenReturn(mappedCliente);
        when(clienteRepository.save(any())).thenReturn(savedCliente);
        when(clienteMapper.toResponse(savedCliente)).thenReturn(response);

        clienteService.createCliente(request);

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        Cliente persisted = captor.getValue();
        assertEquals(Cliente.TipoDocumento.SIN_DOCUMENTO, persisted.getTipoDocumento());
        assertNull(persisted.getDocumentoIdentidad());
    }

    @Test
    void createSinDocumentoConBlankPersistidoComoNull() {
        request.setTipoDocumento("SIN_DOCUMENTO");
        request.setDocumentoIdentidad("   ");
        mappedCliente.setTipoDocumento(Cliente.TipoDocumento.SIN_DOCUMENTO);
        mappedCliente.setDocumentoIdentidad("   ");
        savedCliente.setTipoDocumento(Cliente.TipoDocumento.SIN_DOCUMENTO);
        savedCliente.setDocumentoIdentidad(null);

        when(clienteMapper.toEntity(request)).thenReturn(mappedCliente);
        when(clienteRepository.save(any())).thenReturn(savedCliente);
        when(clienteMapper.toResponse(savedCliente)).thenReturn(response);

        clienteService.createCliente(request);

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        Cliente persisted = captor.getValue();
        assertEquals(Cliente.TipoDocumento.SIN_DOCUMENTO, persisted.getTipoDocumento());
        assertNull(persisted.getDocumentoIdentidad());
    }

    @Test
    void updateDeDniASinDocumentoLimpiaDocumento() {
        Cliente existing = new Cliente();
        existing.setIdCliente(1);
        existing.setTipoDocumento(Cliente.TipoDocumento.DNI);
        existing.setDocumentoIdentidad("12345678");
        existing.setNombre("Juan");
        existing.setApellido("Perez");

        request.setTipoDocumento("SIN_DOCUMENTO");
        request.setDocumentoIdentidad(null);
        savedCliente.setTipoDocumento(Cliente.TipoDocumento.SIN_DOCUMENTO);
        savedCliente.setDocumentoIdentidad(null);

        when(clienteRepository.findById(1)).thenReturn(Optional.of(existing));
        when(clienteRepository.save(any())).thenReturn(savedCliente);
        when(clienteMapper.toResponse(savedCliente)).thenReturn(response);

        clienteService.updateCliente(1, request);

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        Cliente persisted = captor.getValue();
        assertEquals(Cliente.TipoDocumento.SIN_DOCUMENTO, persisted.getTipoDocumento());
        assertNull(persisted.getDocumentoIdentidad());
    }

    @Test
    void updateDeSinDocumentoADniSinDocumentoRechazadoEnValidacion() {
        request.setTipoDocumento("DNI");
        request.setDocumentoIdentidad(null);

        jakarta.validation.Validator validator = jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();
        var violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v ->
                v.getConstraintDescriptor().getAnnotation()
                        instanceof com.restaurante.dto.validation.ValidDocumentoIdentidad));
    }

    @Test
    void updateDeSinDocumentoADniConDocumentoCorrecto() {
        Cliente existing = new Cliente();
        existing.setIdCliente(1);
        existing.setTipoDocumento(Cliente.TipoDocumento.SIN_DOCUMENTO);
        existing.setDocumentoIdentidad(null);
        existing.setNombre("Juan");
        existing.setApellido("Perez");

        request.setTipoDocumento("DNI");
        request.setDocumentoIdentidad("87654321");
        savedCliente.setTipoDocumento(Cliente.TipoDocumento.DNI);
        savedCliente.setDocumentoIdentidad("87654321");

        when(clienteRepository.findById(1)).thenReturn(Optional.of(existing));
        when(clienteRepository.save(any())).thenReturn(savedCliente);
        when(clienteMapper.toResponse(savedCliente)).thenReturn(response);

        clienteService.updateCliente(1, request);

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        Cliente persisted = captor.getValue();
        assertEquals(Cliente.TipoDocumento.DNI, persisted.getTipoDocumento());
        assertEquals("87654321", persisted.getDocumentoIdentidad());
    }
}
