package com.restaurante.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class UploadService {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo inicializar el directorio de subidas", e);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }

        // Get extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate unique name
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = this.rootLocation.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar archivo en disco", e);
        }
    }

    public void deleteFile(String filename) {
        try {
            Path filePath = this.rootLocation.resolve(filename).normalize();
            if (filePath.startsWith(this.rootLocation)) { // Prevent directory traversal
                Files.deleteIfExists(filePath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error al eliminar archivo " + filename, e);
        }
    }
}
