package com.restaurante.service;

import com.restaurante.dto.AuthResponse;
import com.restaurante.dto.UserSummaryDto;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.SesionUsuario;
import com.restaurante.repository.SesionUsuarioRepository;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private SesionUsuarioRepository sesionUsuarioRepository;

    @Transactional
    public AuthResponse login(String username, String password, String ip) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Empleado empleado = userDetails.getEmpleado();

        // Registrar sesión
        SesionUsuario sesion = new SesionUsuario();
        sesion.setEmpleado(empleado);
        sesion.setIp(ip);
        sesionUsuarioRepository.save(sesion);

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
    public void logout(Empleado empleado) {
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
}
