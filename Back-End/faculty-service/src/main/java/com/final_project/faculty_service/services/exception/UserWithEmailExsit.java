package com.final_project.faculty_service.services.exception;

public class UserWithEmailExsit extends RuntimeException {
    public UserWithEmailExsit(String message) {
        super(message);
    }
}
