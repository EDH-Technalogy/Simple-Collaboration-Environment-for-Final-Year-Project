package com.final_project.file_service.domain.service;

public class NotDeleteException extends RuntimeException {
    public NotDeleteException(String message) {
        super(message);
    }
}
