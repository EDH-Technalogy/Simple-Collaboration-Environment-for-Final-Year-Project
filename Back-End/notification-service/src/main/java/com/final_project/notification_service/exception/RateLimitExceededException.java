package com.final_project.notification_service.exception;

public class RateLimitExceededException extends BaseException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}