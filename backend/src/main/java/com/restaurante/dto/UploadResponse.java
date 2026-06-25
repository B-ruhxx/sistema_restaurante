package com.restaurante.dto;

public class UploadResponse {
    private String filename;
    private String url;
    private long size;
    private String contentType;

    public UploadResponse() {
    }

    public UploadResponse(String filename, String url, long size, String contentType) {
        this.filename = filename;
        this.url = url;
        this.size = size;
        this.contentType = contentType;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getFileUrl() {
        return url;
    }

    public void setFileUrl(String fileUrl) {
        this.url = fileUrl;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
