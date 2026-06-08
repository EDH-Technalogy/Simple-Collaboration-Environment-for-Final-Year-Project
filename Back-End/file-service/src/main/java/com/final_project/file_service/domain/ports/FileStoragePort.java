package com.final_project.file_service.domain.ports;

import java.io.InputStream;

public interface FileStoragePort {
    void upload(String buket, String key, InputStream stream, String contentType);
    InputStream download(String buket, String key);
    void delete(String buket, String key);
    String generatePresignedUrl(String buket, String key);
}
