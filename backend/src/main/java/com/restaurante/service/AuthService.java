package com.restaurante.service;

import com.restaurante.dto.AuthResponse;
import com.restaurante.dto.UserSummaryDto;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.SesionUsuario;
import com.restaurante.repository.SesionUsuarioRepository;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private SesionUsuarioRepository sesionUsuarioRepository;

    @Autowired
    private TokenWhitelistService tokenWhitelistService;

    @Transactional
    public AuthResponse login(String username, String password, String ip) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Empleado empleado = userDetails.getEmpleado();

        sesionUsuarioRepository.cerrarSesionesActivas(empleado.getIdEmpleado());

        // Registrar sesión
        SesionUsuario sesion = new SesionUsuario();
        sesion.setEmpleado(empleado);
        sesion.setTokenHash(hashToken(jwt));
        sesion.setIp(ip);
        sesion.setFechaExpiracion(LocalDateTime.ofInstant(
                tokenProvider.getExpirationFromJWT(jwt).toInstant(),
                ZoneId.systemDefault()));
        sesionUsuarioRepository.save(sesion);
        tokenWhitelistService.allowToken(empleado.getIdEmpleado(), jwt);

        java.util.List<String> permisosStr = new java.util.ArrayList<>();
        if (empleado.getRol() != null && empleado.getRol().getPermisos() != null) {
            empleado.getRol().getPermisos().forEach(p -> permisosStr.add(p.getNombre()));
        }

        UserSummaryDto userSummary = new UserSummaryDto(
                empleado.getIdEmpleado(),
                empleado.getNombre(),
                empleado.getApellido(),
                empleado.getUsername(),
                empleado.getRol().getNombre(),
                empleado.getAvatarUrl(),
                permisosStr);

        return new AuthResponse(jwt, userSummary);
    }

    @Transactional
    public void logout(Empleado empleado, String token) {
        if (token != null && !token.isBlank()) {
            tokenWhitelistService.revokeTokenIfCurrent(empleado.getIdEmpleado(), token);
        }

        Optional<SesionUsuario> lastSessionOpt = sesionUsuarioRepository
                .findFirstByEmpleadoIdEmpleadoOrderByFechaInicioDesc(empleado.getIdEmpleado());

        if (lastSessionOpt.isPresent()) {
            SesionUsuario session = lastSessionOpt.get();
            if (session.getFechaLogout() == null) {
                session.setFechaLogout(LocalDateTime.now());
                sesionUsuarioRepository.save(session);
            }
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("No se pudo calcular hash de sesión.", ex);
        }
    }
}
