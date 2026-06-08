package com.final_project.notification_service.dto.request;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to resend a previously failed notification")
public class ResendNotificationRequest {

    @NotNull(message = "Notification ID is required")
    @Schema(description = "ID of the notification to resend")
    private UUID notificationId;

    @Schema(description = "Override recipient email (optional — uses original if omitted)")
    @Email
    private String overrideEmail;
}