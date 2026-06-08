package com.final_project.file_service.api.controller;

import com.final_project.file_service.api.dto.ErrorResponse;
import com.final_project.file_service.domain.service.*;
import io.minio.messages.Bucket;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionController {


    @ExceptionHandler(value = { NotDownloadException.class })
    public ResponseEntity<ErrorResponse> downloadError(NotDownloadException e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.NOT_ACCEPTABLE.value(), LocalDateTime.now()),
                HttpStatus.NOT_ACCEPTABLE
        );
    }
    @ExceptionHandler(value = { NotUploadException.class })
    public ResponseEntity<ErrorResponse> uploadError(NotUploadException e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now()),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
    @ExceptionHandler(value = NotGenerateURLException.class)
    public ResponseEntity<ErrorResponse> generateURLError(NotGenerateURLException e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND.value(), LocalDateTime.now()),
                HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler(value = BucketCreationFail.class)
    public ResponseEntity<ErrorResponse> bucketCreationFail(BucketCreationFail e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now()),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    @ExceptionHandler(value = FileNotFound.class)
    public ResponseEntity<ErrorResponse> get(FileNotFound e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND.value(), LocalDateTime.now()),
                HttpStatus.NOT_FOUND
        );
    }


}
