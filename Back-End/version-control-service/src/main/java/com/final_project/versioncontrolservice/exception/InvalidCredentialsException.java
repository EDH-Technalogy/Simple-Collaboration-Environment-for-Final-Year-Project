package com.final_project.versioncontrolservice.exception;

public  class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}