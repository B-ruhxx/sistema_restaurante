package com.restaurante.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = DocumentoIdentidadValidator.class)
@Documented
public @interface ValidDocumentoIdentidad {
    String message() default "Documento de identidad inválido para el tipo de documento seleccionado";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
