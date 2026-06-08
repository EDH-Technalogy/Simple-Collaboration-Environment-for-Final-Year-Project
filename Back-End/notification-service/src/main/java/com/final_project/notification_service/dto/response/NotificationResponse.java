package com.final_project.notification_service.dto.response;
import com.final_project.notification_service.model.NotificationChannel;
import com.final_project.notification_service.model.NotificationStatus;
import com.final_project.notification_service.model.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Notification response payload")
public class NotificationResponse {

    @Schema(description = "Unique notification ID")
    private UUID id;

    private String recipientUserId;
    private String recipientEmail;
    private String recipientName;

    private NotificationType type;
    private NotificationChannel channel;
    private NotificationStatus status;

    private String subject;
    private String body;

    private String referenceId;
    private String referenceType;
    private String metadata;

    private Integer retryCount;
    private Integer maxRetries;
    private String failureReason;

    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
