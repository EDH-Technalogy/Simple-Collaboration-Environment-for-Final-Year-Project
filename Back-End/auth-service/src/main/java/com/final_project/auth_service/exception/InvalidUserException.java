package com.final_project.auth_service.exception;

public class InvalidUserException extends UserServiceException {
    public InvalidUserException(String message) {
        super("Invalid user data: " + message);
    }
}
