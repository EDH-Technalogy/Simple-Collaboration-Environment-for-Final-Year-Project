package com.final_project.notification_service.model;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryMemberRecipient {

    private String userId;
    private String name;
    private String email;
    private String role;
}