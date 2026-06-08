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
@Schema(description = "Request to login with Google OAuth2")
public class GoogleOAuth2Request {

    @JsonProperty("id_token")
    @Schema(description = "Google ID token from frontend", example = "eyJhbGciOiJSUzI1NiIs...")
    private String idToken;

    @JsonProperty("access_token")
    @Schema(description = "Google access token (optional)", example = "ya29.a0AfH6SMBx...")
    private String accessToken;

    @JsonProperty("device_id")
    @Schema(description = "Device identifier for tracking", example = "device-123")
    private String deviceId;
}
