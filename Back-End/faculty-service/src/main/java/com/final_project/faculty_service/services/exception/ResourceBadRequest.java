package com.final_project.faculty_service.services.exception;

public class ResourceBadRequest extends RuntimeException{
    public ResourceBadRequest(String message){
        super(message);
    }
}
