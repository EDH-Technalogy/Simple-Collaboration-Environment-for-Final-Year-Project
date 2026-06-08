package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.models.ErrorResponse;
import com.final_project.faculty_service.services.exception.ResourceBadRequest;
import com.final_project.faculty_service.services.exception.ResourceExist;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import com.final_project.faculty_service.services.exception.UserWithEmailExsit;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException e){
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                new ErrorResponse(
                        e.getMessage(),
                        HttpStatus.NOT_FOUND.value(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(ResourceBadRequest.class)
    public ResponseEntity<?> handleBadRequest(ResourceNotFoundException e){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new ErrorResponse(
                        e.getMessage(),
                        HttpStatus.BAD_REQUEST.value(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleException(MethodArgumentNotValidException e){
        Map<String,String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error)->{
            errors.put(error.getCode().toString(), error.getDefaultMessage());
        });
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(ResourceExist.class)
    public ResponseEntity<?> handleResourceExist(ResourceExist e){
        return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(
                new ErrorResponse(
                        e.getMessage(),
                        HttpStatus.NOT_ACCEPTABLE.value(),
                        LocalDateTime.now()
                )
        );
    }
    @ExceptionHandler(UserWithEmailExsit.class)
    public ResponseEntity<?> handleUserWithEmail(UserWithEmailExsit e){
        return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(
                new ErrorResponse(
                        e.getMessage(),
                        HttpStatus.CONFLICT.value(),
                        LocalDateTime.now()
                )
        );
    }
}
