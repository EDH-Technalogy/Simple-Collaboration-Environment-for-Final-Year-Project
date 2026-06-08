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
@Schema(description = "Request to assign multiple roles to a user")
public class AssignRolesToUserRequest {

    @NotEmpty(message = "At least one role ID is required")
    @JsonProperty("role_ids")
    @Schema(description = "List of role IDs to assign")
    private Set<String> roleIds;
}