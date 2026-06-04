package com.restaurante.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurante.entity.Auditoria;
import com.restaurante.entity.Empleado;
import com.restaurante.repository.EmpleadoRepository;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.LinkedHashMap;
import java.util.Map;

@Aspect
@Component
public class AuditoriaAspect {

    @Autowired
    private AuditoriaHelperService auditoriaHelperService;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ObjectMapper objectMapper;

    @Around("(execution(* com.restaurante.repository..*.save*(..)) || execution(* com.restaurante.repository..*.delete*(..))) && !execution(* com.restaurante.repository.AuditoriaRepository..*(..))")
    public Object auditar(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        if (args.length == 0 || args[0] == null) {
            return joinPoint.proceed();
        }

        Object entity = args[0];
        // Check if the argument is actually a JPA entity
        if (!isEntity(entity)) {
            return joinPoint.proceed();
        }

        String tableName = getTableName(entity);
        Object id = getEntityId(entity);

        Auditoria.Accion accion = Auditoria.Accion.INSERT;
        String datosAnterioresJson = null;

        if (methodName.startsWith("delete")) {
            accion = Auditoria.Accion.DELETE;
            // Capture before state
            Map<String, Object> prevMap = serializeEntityToMap(entity);
            datosAnterioresJson = toJson(prevMap);
        } else if (methodName.startsWith("save")) {
            if (id != null) {
                // It might be an update, let's try to fetch the previous state from database
                accion = Auditoria.Accion.UPDATE;
                try {
                    Object existing = entityManager.find(entity.getClass(), id);
                    if (existing != null) {
                        Map<String, Object> prevMap = serializeEntityToMap(existing);
                        datosAnterioresJson = toJson(prevMap);
                    }
                } catch (Exception ignored) {}
            } else {
                accion = Auditoria.Accion.INSERT;
            }
        }

        // Proceed with the actual database write
        Object result = joinPoint.proceed();

        // Capture new state
        String datosNuevosJson = null;
        if (accion != Auditoria.Accion.DELETE) {
            Object savedEntity = result != null ? result : entity;
            if (id == null) {
                id = getEntityId(savedEntity);
            }
            Map<String, Object> nextMap = serializeEntityToMap(savedEntity);
            datosNuevosJson = toJson(nextMap);
        }

        // Save auditoria entry independently
        try {
            Auditoria auditoria = new Auditoria();
            auditoria.setTablaAfectada(tableName);
            auditoria.setAccion(accion);
            auditoria.setIdRegistro(id != null ? id.toString() : "PENDIENTE");
            auditoria.setDatosAnteriores(datosAnterioresJson);
            auditoria.setDatosNuevos(datosNuevosJson);
            auditoria.setEmpleado(getAuthenticatedEmpleado());

            auditoriaHelperService.guardarAuditoria(auditoria);
        } catch (Exception e) {
            // Logging can be added here, but we should not fail the main request if auditing fails
            System.err.println("Error guardando auditoria: " + e.getMessage());
        }

        return result;
    }

    private boolean isEntity(Object obj) {
        if (obj == null) return false;
        Class<?> clazz = obj.getClass();
        if (clazz.getName().contains("$$HibernateProxy")) {
            clazz = clazz.getSuperclass();
        }
        return clazz.isAnnotationPresent(Entity.class);
    }

    private String getTableName(Object entity) {
        Class<?> clazz = entity.getClass();
        if (clazz.getName().contains("$$HibernateProxy")) {
            clazz = clazz.getSuperclass();
        }
        if (clazz.isAnnotationPresent(Table.class)) {
            Table table = clazz.getAnnotation(Table.class);
            return table.name();
        }
        return clazz.getSimpleName().toLowerCase();
    }

    private Object getEntityId(Object entity) {
        if (entity == null) return null;
        try {
            Class<?> clazz = entity.getClass();
            if (clazz.getName().contains("$$HibernateProxy")) {
                clazz = clazz.getSuperclass();
            }
            for (Field field : clazz.getDeclaredFields()) {
                if (field.isAnnotationPresent(Id.class) || field.getName().toLowerCase().equals("id" + clazz.getSimpleName().toLowerCase())) {
                    field.setAccessible(true);
                    return field.get(entity);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private Map<String, Object> serializeEntityToMap(Object entity) {
        if (entity == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        try {
            Class<?> clazz = entity.getClass();
            if (clazz.getName().contains("$$HibernateProxy")) {
                clazz = clazz.getSuperclass();
            }
            for (Field field : clazz.getDeclaredFields()) {
                field.setAccessible(true);
                String name = field.getName();
                Object value = field.get(entity);
                if (value == null) {
                    map.put(name, null);
                    continue;
                }
                if (field.isAnnotationPresent(Transient.class)) {
                    continue;
                }
                // Skip collections and maps to avoid lazy load and circular dependency issues
                if (value instanceof java.util.Collection || value instanceof java.util.Map) {
                    continue;
                }
                if (value.getClass().isAnnotationPresent(Entity.class)) {
                    Object idVal = getEntityId(value);
                    map.put(name + "Id", idVal);
                } else if (value.getClass().getName().startsWith("java.") || value.getClass().isPrimitive() || value instanceof Enum) {
                    map.put(name, value);
                }
            }
        } catch (Exception e) {
            map.put("error", "Error serializando campos: " + e.getMessage());
        }
        return map;
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    private Empleado getAuthenticatedEmpleado() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                Object principal = auth.getPrincipal();
                if (principal instanceof com.restaurante.security.CustomUserDetails) {
                    return ((com.restaurante.security.CustomUserDetails) principal).getEmpleado();
                } else {
                    String username = auth.getName();
                    return empleadoRepository.findByUsername(username).orElse(null);
                }
            }
        } catch (Exception ignored) {}
        // Fallback: search for admin
        return empleadoRepository.findByUsername("admin").orElse(null);
    }
}
