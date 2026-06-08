package com.final_project.auth_service.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class AuthorResponse {
    private String id;
    private String userName;
    private String email;
    private String profile;
    private String entityId;
    private String userType;
}
