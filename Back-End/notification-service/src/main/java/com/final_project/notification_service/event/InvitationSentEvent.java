package com.final_project.notification_service.event;

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
public class InvitationSentEvent {
    private String eventId;
    private String invitationId;
    private String inviteeEmail;
    private String inviteeName;
    private String inviterUserId;
    private String inviterName;
    private String invitationType;      // SYSTEM, REPOSITORY
    private String targetId;            // repoId or null for system invitations
    private String targetName;          // repo name or system name
    private String targetUrl;           // deep link for accept action
    private String invitationToken;
    private LocalDateTime expiresAt;
    private LocalDateTime occurredAt;
}
