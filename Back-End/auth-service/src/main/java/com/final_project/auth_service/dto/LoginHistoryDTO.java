package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * LoginHistoryDTO - DTO for login history.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User login history entry")
public class LoginHistoryDTO {

    @JsonProperty("id")
    @Schema(description = "Login history ID")
    private String id;

    @JsonProperty("user_id")
    @Schema(description = "User ID")
    private String userId;

    @JsonProperty("timestamp")
    @Schema(description = "Login timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("ip_address")
    @Schema(description = "IP address of login")
    private String ipAddress;

    @JsonProperty("user_agent")
    @Schema(description = "Browser/device user agent")
    private String userAgent;

    @JsonProperty("device_type")
    @Schema(description = "Device type (mobile, desktop, tablet)")
    private String deviceType;

    @JsonProperty("location")
    @Schema(description = "Geographic location (if available)")
    private String location;

    @JsonProperty("success")
    @Schema(description = "Whether login was successful")
    private Boolean success;

    @JsonProperty("failure_reason")
    @Schema(description = "Reason for login failure (if unsuccessful)")
    private String failureReason;
}