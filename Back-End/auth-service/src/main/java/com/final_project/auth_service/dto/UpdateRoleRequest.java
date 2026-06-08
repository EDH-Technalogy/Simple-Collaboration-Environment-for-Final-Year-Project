package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to update an existing role")
public class UpdateRoleRequest {

    @Size(min = 3, max = 50, message = "Role name must be between 3 and 50 characters")
    @JsonProperty("name")
    @Schema(description = "Updated role name", example = "ADMIN")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    @JsonProperty("description")
    @Schema(description = "Updated description")
    private String description;

    @JsonProperty("is_active")
    @Schema(description = "Whether role is active", example = "true")
    private Boolean isActive;
}
