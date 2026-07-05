package com.restaurante.dto.validation;

import static org.junit.jupiter.api.Assertions.*;

import com.restaurante.dto.request.ClienteRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

class ClienteRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void dniConDocumentoValido() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");
        request.setTipoDocumento("DNI");
        request.setDocumentoIdentidad("12345678");

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().noneMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }

    @Test
    void dniSinDocumentoRechazado() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");
        request.setTipoDocumento("DNI");
        request.setDocumentoIdentidad(null);

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }

    @Test
    void sinDocumentoConNullAceptado() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");
        request.setTipoDocumento("SIN_DOCUMENTO");
        request.setDocumentoIdentidad(null);

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().noneMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }

    @Test
    void sinDocumentoConBlankAceptado() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");
        request.setTipoDocumento("SIN_DOCUMENTO");
        request.setDocumentoIdentidad("   ");

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().noneMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }

    @Test
    void sinDocumentoConValorRechazado() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");
        request.setTipoDocumento("SIN_DOCUMENTO");
        request.setDocumentoIdentidad("12345678");

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }

    @Test
    void rucConDocumentoValido() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Empresa");
        request.setApellido("SA");
        request.setTipoDocumento("RUC");
        request.setDocumentoIdentidad("20123456789");

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().noneMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }

    @Test
    void tipoDocumentoNuloConDocumentoNullAceptado() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");
        request.setTipoDocumento(null);
        request.setDocumentoIdentidad(null);

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().noneMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }

    @Test
    void tipoDocumentoNuloConDocumentoRechazado() {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Juan");
        request.setApellido("Perez");
        request.setTipoDocumento(null);
        request.setDocumentoIdentidad("12345678");

        Set<ConstraintViolation<ClienteRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v ->
                v.getConstraintDescriptor().getAnnotation() instanceof ValidDocumentoIdentidad));
    }
}
