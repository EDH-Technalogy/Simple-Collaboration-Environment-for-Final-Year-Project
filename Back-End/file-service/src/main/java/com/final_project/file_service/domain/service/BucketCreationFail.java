package com.final_project.file_service.domain.service;

public class BucketCreationFail extends RuntimeException {
    public BucketCreationFail(String message) {
        super(message);
    }
}
