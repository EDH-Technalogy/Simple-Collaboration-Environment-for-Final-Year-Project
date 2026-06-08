package com.final_project.faculty_service.DTO.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SendNotificationRequest {
    private String recipientUserId;
    private String recipientEmail;
    private String recipientName;
    private String type;
    private String channel;
    private String subject;
    private String body;
    private String referenceId;
    private String referenceType;
    private String idempotencyKey;
}
