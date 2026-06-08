package com.final_project.auth_service.exception;

/**
 * Exception thrown for duplicate user creation.
 */
public class DuplicateUserException extends UserServiceException {
    public DuplicateUserException(String field, String value) {
        super("A user already exists with " + field + ": " + value);
    }
}