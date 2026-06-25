package com.restaurante.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @org.springframework.beans.factory.annotation.Autowired
    private StorageProperties storageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path path = Paths.get(storageProperties.getDir()).toAbsolutePath().normalize();
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + path.toString() + "/");
    }
}
