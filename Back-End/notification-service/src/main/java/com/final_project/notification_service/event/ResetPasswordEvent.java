package com.final_project.notification_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Data
public class ResetPasswordEvent {
    private String eventId;
    private String userId;
    private String email;
    private String firstName;
    private String changeType;          // CHANGED, RESET
    private String ipAddress;           // for security notice
    private String userAgent;
    private LocalDateTime occurredAt;
    private String resetToken;
}
