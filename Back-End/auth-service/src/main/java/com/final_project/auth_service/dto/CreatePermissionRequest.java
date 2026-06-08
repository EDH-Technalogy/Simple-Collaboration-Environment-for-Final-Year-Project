package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create a new permission")
public class CreatePermissionRequest {

    @NotBlank(message = "Permission name is required")
    @Size(min = 3, max = 50, message = "Permission name must be between 3 and 50 characters")
    @JsonProperty("name")
    @Schema(description = "Permission name", example = "USER_READ")
    private String name;

    @JsonProperty("description")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Schema(description = "Permission description", example = "Permission to read user information")
    private String description;

    @NotBlank(message = "Client ID is required")
    @JsonProperty("client_id")
    @Schema(description = "Keycloak client ID that owns this permission", example = "file-service")
    private String clientId;

    @NotBlank(message = "Resource is required")
    @Size(min = 2, max = 50, message = "Resource must be between 2 and 50 characters")
    @JsonProperty("resource")
    @Schema(description = "Resource name", example = "USER")
    private String resource;

    @NotBlank(message = "Action is required")
    @Size(min = 2, max = 50, message = "Action must be between 2 and 50 characters")
    @JsonProperty("action")
    @Schema(description = "Action name", example = "READ")
    private String action;

    @JsonProperty("is_system_permission")
    @Schema(description = "Kept for backward compatibility. Keycloak is the system of record.", example = "false")
    private Boolean isSystemPermission = false;
}
