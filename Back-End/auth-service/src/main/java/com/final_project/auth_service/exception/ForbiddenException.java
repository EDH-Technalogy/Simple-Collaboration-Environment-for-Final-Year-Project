package com.final_project.auth_service.exception;

/**
 * Exception thrown for forbidden access.
 */
public class ForbiddenException extends UserServiceException {
    public ForbiddenException(String message) {
        super("Forbidden: " + message);
    }
}