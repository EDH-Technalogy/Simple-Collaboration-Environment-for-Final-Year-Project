package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create multiple roles at once")
public class BulkCreateRolesRequest {

    @NotEmpty(message = "At least one role is required")
    @JsonProperty("roles")
    @Schema(description = "List of roles to create")
    private java.util.List<CreateRoleRequest> roles;
}