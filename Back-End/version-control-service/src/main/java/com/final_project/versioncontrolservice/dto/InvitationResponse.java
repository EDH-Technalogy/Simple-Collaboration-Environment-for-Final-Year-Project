package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.Invitation;
import com.final_project.versioncontrolservice.model.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
@Builder
public record InvitationResponse(
        @JsonProperty("id") String id,
        @JsonProperty("repo_owner") String repoOwner,
        @JsonProperty("repo_name") String repoName,
        @JsonProperty("invited_user") String invitedUser,
        String role,
        InvitationStatus status,
        @JsonProperty("created_at") LocalDateTime createdAt
) {
    public static InvitationResponse from(Invitation d) {
        return new InvitationResponse(
                d.getId(),
                d.getHostUser().getUsername(),
                d.getRepository().getRepositoryName(),
                d.getGuestUser().getUsername(),
                d.getRole(),
                d.getStatus(),
                d.getCreatedAt()
        );
    }
}
