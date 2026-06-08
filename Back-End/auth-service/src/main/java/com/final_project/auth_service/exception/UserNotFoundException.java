package com.final_project.auth_service.exception;

public class UserNotFoundException extends UserServiceException {
    public UserNotFoundException(String userId) {
        super("User not found with ID: " + userId);
    }

    public UserNotFoundException(String field, String value) {
        super("User not found with " + field + ": " + value);
    }
}
