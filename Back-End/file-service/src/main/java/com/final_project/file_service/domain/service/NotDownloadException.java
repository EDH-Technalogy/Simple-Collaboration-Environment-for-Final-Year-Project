package com.final_project.file_service.domain.service;

public class NotDownloadException extends RuntimeException {
    public NotDownloadException(String message) {
        super(message);
    }
}
