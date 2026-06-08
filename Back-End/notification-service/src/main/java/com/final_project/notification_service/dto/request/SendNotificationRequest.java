package com.final_project.notification_service.dto.request;

import com.final_project.notification_service.model.NotificationChannel;
import com.final_project.notification_service.model.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to send a custom notification to a user")
public class SendNotificationRequest {

    @NotBlank(message = "Recipient user ID is required")
    @Schema(description = "Target user identifier", example = "usr_abc123")
    private String recipientUserId;

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 320)
    @Schema(description = "Target email address", example = "john@example.com")
    private String recipientEmail;

    @Size(max = 200)
    @Schema(description = "Display name of recipient", example = "John Doe")
    private String recipientName;

    @NotNull(message = "Notification type is required")
    @Schema(description = "Type of notification")
    private NotificationType type;

    @NotNull(message = "Channel is required")
    @Builder.Default
    @Schema(description = "Delivery channel", defaultValue = "EMAIL")
    private NotificationChannel channel = NotificationChannel.EMAIL;

    @NotBlank(message = "Subject is required")
    @Size(max = 500, message = "Subject must not exceed 500 characters")
    @Schema(description = "Email subject line", example = "Welcome to our platform!")
    private String subject;

    @NotBlank(message = "Body is required")
    @Schema(description = "Notification body (HTML supported for email)")
    private String body;

    @Size(max = 100)
    @Schema(description = "Reference entity ID (blog post, repo, comment)", example = "post_xyz")
    private String referenceId;

    @Size(max = 50)
    @Schema(description = "Reference entity type", example = "BLOG_POST")
    private String referenceType;

    @Size(max = 200)
    @Schema(description = "Optional idempotency key for deduplication")
    private String idempotencyKey;
}