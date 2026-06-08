package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * TokenValidationResponse - Response DTO for token validation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Token validation response")
public class TokenValidationResponse {

    @JsonProperty("valid")
    @Schema(description = "Whether token is valid", example = "true")
    private Boolean valid;

    @JsonProperty("user_id")
    @Schema(description = "User ID from token")
    private String userId;

    @JsonProperty("username")
    @Schema(description = "Username from token")
    private String username;

    @JsonProperty("email")
    @Schema(description = "Email from token")
    private String email;

    @JsonProperty("roles")
    @Schema(description = "User roles from token")
    private java.util.List<String> roles;

    @JsonProperty("expires_at")
    @Schema(description = "Token expiration time")
    private LocalDateTime expiresAt;

    @JsonProperty("message")
    @Schema(description = "Message (error if not valid)")
    private String message;
}
