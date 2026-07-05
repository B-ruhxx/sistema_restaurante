package com.restaurante.dto.validation;

import com.restaurante.dto.request.ClienteRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DocumentoIdentidadValidator implements ConstraintValidator<ValidDocumentoIdentidad, ClienteRequest> {

    @Override
    public boolean isValid(ClienteRequest request, ConstraintValidatorContext context) {
        if (request == null) return true;

        String tipo = request.getTipoDocumento();
        String documento = request.getDocumentoIdentidad();

        boolean esSindocumento = "SIN_DOCUMENTO".equalsIgnoreCase(tipo)
                || tipo == null
                || tipo.isBlank();

        if (esSindocumento) {
            return documento == null || documento.isBlank();
        } else {
            return documento != null && !documento.isBlank();
        }
    }
}
