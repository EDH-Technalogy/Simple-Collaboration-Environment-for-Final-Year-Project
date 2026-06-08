package com.final_project.faculty_service.services.exception;

public class ResourceExist extends RuntimeException {
    public ResourceExist(String message) {
        super(message);
    }
}
