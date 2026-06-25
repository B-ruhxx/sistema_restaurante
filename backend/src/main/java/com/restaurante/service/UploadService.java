package com.restaurante.service;

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

    @org.springframework.beans.factory.annotation.Autowired
    private com.restaurante.config.StorageProperties storageProperties;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(storageProperties.getDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo inicializar el directorio de subidas", e);
        }
    }

    public String storeFile(MultipartFile file) {
        return storeFile(file, "general");
    }

    public String storeFile(MultipartFile file, String module) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }

        // Clean module name to prevent path traversal
        String sanitizedModule = module.replaceAll("[^a-zA-Z0-9_-]", "");
        Path moduleLocation = this.rootLocation.resolve(sanitizedModule);
        try {
            Files.createDirectories(moduleLocation);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio del módulo: " + sanitizedModule, e);
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
            Path targetLocation = moduleLocation.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return sanitizedModule + "/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar archivo en disco", e);
        }
    }

    public String storeFileFromUrl(String urlString, String module) {
        if (urlString == null || urlString.isEmpty()) {
            throw new IllegalArgumentException("La URL está vacía");
        }

        // Clean module name to prevent path traversal
        String sanitizedModule = module.replaceAll("[^a-zA-Z0-9_-]", "");
        Path moduleLocation = this.rootLocation.resolve(sanitizedModule);
        try {
            Files.createDirectories(moduleLocation);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio del módulo: " + sanitizedModule, e);
        }

        // Detect extension from URL or use a fallback
        String extension = ".jpg";
        try {
            java.net.URI uri = new java.net.URI(urlString);
            String path = uri.getPath();
            if (path != null && path.contains(".")) {
                String ext = path.substring(path.lastIndexOf("."));
                if (ext.length() <= 5 && ext.matches("\\.[a-zA-Z0-9]+")) {
                    extension = ext;
                }
            }
        } catch (Exception e) {
            // ignore and fallback to .jpg
        }

        // Generate unique name
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        Path targetLocation = moduleLocation.resolve(uniqueFilename);

        try {
            java.net.URL url = java.net.URI.create(urlString).toURL();
            java.net.URLConnection connection = url.openConnection();
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            try (java.io.InputStream in = connection.getInputStream()) {
                Files.copy(in, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }
            return sanitizedModule + "/" + uniqueFilename;
        } catch (Exception e) {
            throw new RuntimeException("Error al descargar e importar la imagen desde la URL: " + urlString, e);
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
