package com.final_project.faculty_service.DTO;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class RoleDTO {

    @JsonProperty("id")
    private String id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("description")
    private String description;

    private String roleKey;
    @JsonProperty("isSystemRole")
    private Boolean isSystemRole;
    @JsonProperty("isActive")
    private Boolean isActive;
    private Set<String> permissionIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @JsonProperty("permissions")
    private Set<PermissionDTO> permissions;
}