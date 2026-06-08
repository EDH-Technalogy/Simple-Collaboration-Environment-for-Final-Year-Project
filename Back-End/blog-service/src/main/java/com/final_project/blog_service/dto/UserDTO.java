package com.final_project.blog_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Data Transfer Objects for User API endpoints.
 */

/**
 * UserDTO - Response DTO for user information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User information response")
public class UserDTO {

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

    @JsonProperty("phone_number")
    @Schema(description = "User phone number", example = "+1234567890")
    private String phoneNumber;

    @JsonProperty("status")
    @Schema(description = "User account status", example = "ACTIVE")
    private String status;

    @JsonProperty("email_verified")
    @Schema(description = "Whether email is verified", example = "true")
    private Boolean emailVerified;

    @JsonProperty("two_factor_enabled")
    @Schema(description = "Whether two-factor authentication is enabled", example = "false")
    private Boolean twoFactorEnabled;

    @JsonProperty("roles")
    @Schema(description = "Realm roles")
    private Set<String> roles;


}

