package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class ContributorUser {
    @JsonProperty("id")
    @Schema(description = "User unique identifier", example = "550e8400-e29b-41d4-a716-446655440000")
    private String id;

    @JsonProperty("user_name")
    @Schema(description = "User username", example = "john.doe")
    private String username;

    @JsonProperty("email")
    @Schema(description = "User email address", example = "john.doe@example.com")
    private String email;

    @JsonProperty("first_name")
    @Schema(description = "User first name", example = "John")
    private String firstName;

    @JsonProperty("last_name")
    @Schema(description = "User last name", example = "Doe")
    private String lastName;

    @JsonProperty("status")
    @Schema(description = "User account status", example = "ACTIVE")
    private String status;

    @JsonProperty("roles")
    @Schema(description = "Realm roles")
    private Set<String> roles;
    @JsonProperty("profile")
    @Schema(description = "http:u023i23")
    private String profile;
}
