package com.final_project.auth_service.exception;


/**
 * Exception thrown for Keycloak integration errors.
 */
public class KeycloakException extends UserServiceException {
    public KeycloakException(String message) {
        super("Keycloak error: " + message);
    }

    public KeycloakException(String message, Throwable cause) {
        super("Keycloak error: " + message + ""+ cause);
    }
}
