package com.final_project.versioncontrolservice.model;

import com.final_project.versioncontrolservice.dto.RepositoryMetadata;
import com.final_project.versioncontrolservice.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "repo_invitations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {
    @Id
    private String id;
    private RepositoryMetadata repository;
    private UserDTO guestUser;
    private UserDTO hostUser;
    private String role;
    private InvitationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}