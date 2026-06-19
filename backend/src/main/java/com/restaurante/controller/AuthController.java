package com.restaurante.controller;

import com.restaurante.dto.AuthResponse;
import com.restaurante.dto.LoginRequest;
import com.restaurante.entity.Empleado;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {
        try {
            AuthResponse response = authService.login(
                    loginRequest.getUsername(),
                    loginRequest.getPassword(),
                    request.getRemoteAddr());
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Usuario o contraseña incorrectos. Por favor, intente de nuevo.");
            return ResponseEntity.status(401).body(err);
        } catch (DataAccessException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Error de base de datos al registrar la sesión: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Error interno al iniciar sesión: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getPrincipal())) {
                if (authentication.getPrincipal() instanceof CustomUserDetails) {
                    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                    Empleado empleado = userDetails.getEmpleado();
                    authService.logout(empleado);
                } else {
                    System.err.println("Principal inesperado en logout: " + authentication.getPrincipal().getClass());
                }
            }
        } catch (DataAccessException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error al cerrar la sesión en la base de datos: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        } catch (ClassCastException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error de tipo de usuario autenticado: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error interno al cerrar sesión: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }

        SecurityContextHolder.clearContext();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cierre de sesión exitoso.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
                if (authentication.getPrincipal() instanceof CustomUserDetails) {
                    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                    Empleado empleado = userDetails.getEmpleado();

                    java.util.List<String> permisosStr = new java.util.ArrayList<>();
                    if (empleado.getRol() != null && empleado.getRol().getPermisos() != null) {
                        empleado.getRol().getPermisos().forEach(p -> permisosStr.add(p.getNombre()));
                    }

                    com.restaurante.dto.UserSummaryDto userSummary = new com.restaurante.dto.UserSummaryDto(
                            empleado.getIdEmpleado(),
                            empleado.getNombre(),
                            empleado.getApellido(),
                            empleado.getUsername(),
                            empleado.getRol().getNombre(),
                            empleado.getAvatarUrl(),
                            permisosStr);

                    return ResponseEntity.ok(userSummary);
                }
            }
            return ResponseEntity.status(401).body(Map.of("message", "No autenticado"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error al obtener usuario actual: " + e.getMessage()));
        }
    }
}