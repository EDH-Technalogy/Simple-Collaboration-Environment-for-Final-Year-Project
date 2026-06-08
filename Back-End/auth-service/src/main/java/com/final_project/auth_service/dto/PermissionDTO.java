package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * PermissionDTO - Response DTO for permission information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Permission information response")
public class PermissionDTO {

    @JsonProperty("id")
    @Schema(description = "Permission unique identifier")
    private String id;


    @JsonProperty("name")
    @Schema(description = "Permission name")
    private String name;


    private String permissionKey;
    private boolean  isSystemPermission;

    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @JsonProperty("description")
    @Schema(description = "Permission description")
    private String description;

    @JsonProperty("resource")
    @Schema(description = "Resource name", example = "USER")
    private String resource;

    @JsonProperty("action")
    @Schema(description = "Action name", example = "READ")
    private String action;
}
