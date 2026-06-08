package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoginRequest - Request DTO for user login.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to login with credentials")
public class LoginRequest {

    @NotBlank(message = "Email or username is required")
    @JsonProperty("username_or_email")
    @Schema(description = "Email address or username", example = "john.doe@example.com")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    @JsonProperty("password")
    @Schema(description = "User password", example = "SecurePassword123!")
    private String password;

    @JsonProperty("remember_me")
    @Schema(description = "Remember this device", example = "false")
    private Boolean rememberMe = false;
}
