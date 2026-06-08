package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Authentication response with tokens")
public class AuthResponse {

    @JsonProperty("access_token")
    @Schema(description = "JWT access token for API calls")
    private String accessToken;

    @JsonProperty("refresh_token")
    @Schema(description = "JWT refresh token for token renewal")
    private String refreshToken;

    @JsonProperty("token_type")
    @Schema(description = "Token type", example = "Bearer")
    private String tokenType = "Bearer";

    @JsonProperty("expires_in")
    @Schema(description = "Token expiration time in seconds", example = "3600")
    private Long expiresIn;

    @JsonProperty("user")
    @Schema(description = "User information")
    private UserDTO user;

    @JsonProperty("message")
    @Schema(description = "Success message")
    private String message;
}
