package com.restaurante.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(status);
    }

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> getDbHealth() {
        Map<String, Object> status = new LinkedHashMap<>();
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.execute("SELECT 1");
                status.put("status", "UP");
                status.put("database", "MariaDB/MySQL Connection Healthy");
            } catch (Exception e) {
                status.put("status", "DOWN");
                status.put("error", e.getMessage());
                return ResponseEntity.status(503).body(status);
            }
        } else {
            status.put("status", "DOWN");
            status.put("error", "JdbcTemplate bean not available");
            return ResponseEntity.status(503).body(status);
        }
        return ResponseEntity.ok(status);
    }

    @GetMapping("/cache")
    public ResponseEntity<Map<String, Object>> getCacheHealth() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "DISABLED");
        status.put("message", "Spring Cache is not yet implemented or enabled");
        return ResponseEntity.ok(status);
    }
}
