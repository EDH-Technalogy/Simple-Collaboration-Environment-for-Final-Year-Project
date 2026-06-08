package com.final_project.faculty_service.DTO;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * PermissionDTO - Response DTO for permission information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionDTO {

    @JsonProperty("id")
    private String id;


    @JsonProperty("name")
    private String name;


    private String permissionKey;
    private boolean  isSystemPermission;

    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @JsonProperty("description")
    private String description;

    @JsonProperty("resource")
    private String resource;

    @JsonProperty("action")
    private String action;
}