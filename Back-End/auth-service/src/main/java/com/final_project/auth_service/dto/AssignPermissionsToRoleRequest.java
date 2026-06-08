package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to assign multiple permissions to a role")
public class AssignPermissionsToRoleRequest {

    @NotEmpty(message = "At least one permission ID is required")
    @JsonProperty("permission_ids")
    @Schema(description = "List of permission IDs to assign")
    private Set<String> permissionIds;
}