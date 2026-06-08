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
@Schema(description = "Request to create multiple permissions at once")
public class BulkCreatePermissionsRequest {

    @NotEmpty(message = "At least one permission is required")
    @JsonProperty("permissions")
    @Schema(description = "List of permissions to create")
    private java.util.List<CreatePermissionRequest> permissions;
}