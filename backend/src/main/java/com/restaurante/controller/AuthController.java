package com.restaurante.controller;

import com.restaurante.dto.AuthResponse;
import com.restaurante.dto.LoginRequest;
import com.restaurante.dto.UserSummaryDto;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.SesionUsuario;
import com.restaurante.repository.SesionUsuarioRepository;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private SesionUsuarioRepository sesionUsuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Empleado empleado = userDetails.getEmpleado();

        // Register session in the database
        SesionUsuario sesion = new SesionUsuario();
        sesion.setEmpleado(empleado);
        sesion.setIp(request.getRemoteAddr());
        // Note: fechaLogin is generated automatically by MariaDB (DEFAULT CURRENT_TIMESTAMP)
        sesionUsuarioRepository.save(sesion);

        UserSummaryDto userSummary = new UserSummaryDto(
                empleado.getIdEmpleado(),
                empleado.getNombre(),
                empleado.getApellido(),
                empleado.getUsername(),
                empleado.getRol().getNombre()
        );

        return ResponseEntity.ok(new AuthResponse(jwt, userSummary));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Empleado empleado = userDetails.getEmpleado();

            // Find last active session and close it
            Optional<SesionUsuario> lastSessionOpt = sesionUsuarioRepository
                    .findFirstByEmpleadoIdEmpleadoOrderByFechaLoginDesc(empleado.getIdEmpleado());
            
            if (lastSessionOpt.isPresent()) {
                SesionUsuario session = lastSessionOpt.get();
                if (session.getFechaLogout() == null) {
                    session.setFechaLogout(LocalDateTime.now());
                    sesionUsuarioRepository.save(session);
                }
            }
        }

        SecurityContextHolder.clearContext();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cierre de sesión exitoso.");
        return ResponseEntity.ok(response);
    }
}
