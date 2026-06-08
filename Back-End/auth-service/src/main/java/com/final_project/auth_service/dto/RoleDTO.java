package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Role information response")
public class RoleDTO {

    @JsonProperty("id")
    @Schema(description = "Role unique identifier")
    private String id;

    @JsonProperty("name")
    @Schema(description = "Role name", example = "ADMIN")
    private String name;

    @JsonProperty("description")
    @Schema(description = "Role description")
    private String description;

    private String roleKey;
    private boolean isSystemRole;
    private boolean isActive;
    private Set<String> permissionIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @JsonProperty("permissions")
    @Schema(description = "Permissions assigned to this role")
    private Set<String> permissions;
}
