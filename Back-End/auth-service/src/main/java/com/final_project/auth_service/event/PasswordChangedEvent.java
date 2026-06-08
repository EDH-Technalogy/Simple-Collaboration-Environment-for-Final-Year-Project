package com.final_project.auth_service.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PasswordChangedEvent {
    private String eventId;
    private String userId;
    private String email;
    private String firstName;
    private String changeType;          // CHANGED, RESET
    private String ipAddress;           // for security notice
    private String userAgent;
    private LocalDateTime occurredAt;
}
