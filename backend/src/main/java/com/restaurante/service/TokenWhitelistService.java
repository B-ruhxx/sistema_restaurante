package com.restaurante.service;

import com.restaurante.config.SecurityProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Base64;

@Service
public class TokenWhitelistService {

    private static final String ACTIVE_TOKEN_PREFIX = "auth:active-token:";

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private SecurityProperties securityProperties;

    public void allowToken(Integer empleadoId, String token) {
        redisTemplate.opsForValue().set(
                buildKey(empleadoId),
                hashToken(token),
                Duration.ofMillis(securityProperties.getExpiration()));
    }

    public boolean isTokenAllowed(Integer empleadoId, String token) {
        String activeTokenHash = redisTemplate.opsForValue().get(buildKey(empleadoId));
        return activeTokenHash != null && activeTokenHash.equals(hashToken(token));
    }

    public void revokeTokenIfCurrent(Integer empleadoId, String token) {
        String key = buildKey(empleadoId);
        String activeTokenHash = redisTemplate.opsForValue().get(key);
        if (activeTokenHash != null && activeTokenHash.equals(hashToken(token))) {
            redisTemplate.delete(key);
        }
    }

    public void revokeActiveToken(Integer empleadoId) {
        redisTemplate.delete(buildKey(empleadoId));
    }

    private String buildKey(Integer empleadoId) {
        return ACTIVE_TOKEN_PREFIX + empleadoId;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("No se pudo calcular el hash del token", ex);
        }
    }
}
