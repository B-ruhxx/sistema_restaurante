package com.restaurante.controller;

import com.restaurante.dto.UploadResponse;
import com.restaurante.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {

    @Autowired
    private UploadService uploadService;

    @PostMapping
    public ResponseEntity<UploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "module", defaultValue = "general") String module) {
        String filename = uploadService.storeFile(file, module);
        
        // The URL is relative to server root: /api/uploads/{filename} (where filename is e.g. "categorias/foo.jpg")
        String fileUrl = "/api/uploads/" + filename;
        
        UploadResponse response = new UploadResponse(
                filename,
                fileUrl,
                file.getSize(),
                file.getContentType()
        );
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/url")
    public ResponseEntity<UploadResponse> uploadFileFromUrl(
            @RequestParam("url") String url,
            @RequestParam(value = "module", defaultValue = "general") String module) {
        String filename = uploadService.storeFileFromUrl(url, module);
        String fileUrl = "/api/uploads/" + filename;
        
        UploadResponse response = new UploadResponse(
                filename,
                fileUrl,
                0,
                "image/jpeg"
        );
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{*filename}")
    public ResponseEntity<Void> deleteFile(@PathVariable String filename) {
        uploadService.deleteFile(filename);
        return ResponseEntity.ok().build();
    }
}
