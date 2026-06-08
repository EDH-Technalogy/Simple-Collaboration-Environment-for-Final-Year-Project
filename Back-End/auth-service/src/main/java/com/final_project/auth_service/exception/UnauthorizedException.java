package com.final_project.auth_service.exception;

/**
 * Exception thrown for unauthorized access.
 */
public class UnauthorizedException extends UserServiceException {
    public UnauthorizedException(String message) {
        super("Unauthorized: " + message);
    }
}