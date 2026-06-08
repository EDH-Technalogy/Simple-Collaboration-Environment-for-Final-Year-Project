package com.final_project.notification_service.exception;


import java.util.UUID;

public class NotificationNotFoundException extends BaseException {
    public NotificationNotFoundException(UUID id) {
        super("Notification not found: " + id);
    }
}